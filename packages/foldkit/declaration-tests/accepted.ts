import { Context, Effect, Layer, Option, Schema } from 'effect'
import {
  type Application as ApplicationProgram,
  type Element as ElementProgram,
  define as defineApplication,
  provide,
} from 'foldkit/application'
import * as Block from 'foldkit/block'
import * as Command from 'foldkit/command'
import { Server } from 'foldkit/experimental'
import { defineMessageUnion } from 'foldkit/message'
import * as Update from 'foldkit/update'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value

export class Clock extends Context.Service<
  Clock,
  Readonly<{ now: Effect.Effect<number> }>
>()('DeclarationTestsClock') {}

const DeclarationTestsChild = Block.define('DeclarationTestsChild')

// eslint-disable-next-line foldkit/block-name-matches-variable
const SingleColonOwner = Block.define('DeclarationTests:SingleColon')
export const SingleColonBlock = SingleColonOwner.define({
  Model: Schema.Struct({ value: Schema.Number }),
  Message: defineMessageUnion({ RequestedWork: {} }),
})

export const ChildModel = Schema.Struct({ value: Schema.Number })
export type ChildModel = typeof ChildModel.Type

export const ChildMessage = defineMessageUnion({
  RequestedRead: {},
  CompletedRead: { value: Schema.Number },
  CompletedMeasure: { height: Schema.Number },
})
export type ChildMessage = typeof ChildMessage.Type

const handlerConstruction: Effect.Effect<void, 'HandlerUnavailable'> =
  Effect.void

export const ReadCount = DeclarationTestsChild.command('ReadCount', {
  messages: [ChildMessage.CompletedRead],
  handler: function* () {
    const clock = yield* Clock
    yield* handlerConstruction

    return () =>
      clock.now.pipe(Effect.map(value => ChildMessage.CompletedRead({ value })))
  },
})

export const Measure = DeclarationTestsChild.mount('Measure', {
  messages: [ChildMessage.CompletedMeasure],
  handler: function* () {
    return ({ element }) =>
      Effect.succeed(
        ChildMessage.CompletedMeasure({
          height: element.getBoundingClientRect().height,
        }),
      )
  },
})

const childBase = DeclarationTestsChild.define({
  Model: ChildModel,
  Message: ChildMessage,
})
const childDefinition = childBase.register({ mounts: [Measure] })

const childView = childDefinition.view((model, h) =>
  h.div([h.OnMount(Measure())], [globalThis.String(model.value)]),
)

const childUpdate = childBase.update((model, message) =>
  ChildMessage.match(message, {
    RequestedRead: () => ({ model, commands: [ReadCount()] }),
    CompletedRead: ({ value }) => ({
      model: ChildModel.make({ value }),
    }),
    CompletedMeasure: () => ({ model }),
  }),
)

const refresh = childBase.step(model => ({
  model,
  commands: [ReadCount()],
}))

export const ChildEffectsLayer = Layer.merge(ReadCount.layer, Measure.layer)

type ChildServicesAreExact = Expect<
  Equal<Layer.Services<typeof ChildEffectsLayer>, Clock>
>
type ChildErrorIsExact = Expect<
  Equal<Layer.Error<typeof ChildEffectsLayer>, 'HandlerUnavailable'>
>

export type ChildLayerAssertions = [ChildServicesAreExact, ChildErrorIsExact]

export const Child = childDefinition.assemble({
  init: () => ({ model: ChildModel.make({ value: 0 }) }),
  update: childUpdate,
  view: childView,
  steps: { refresh },
  EffectsLayer: ChildEffectsLayer,
})

export const DirectModel = Schema.Struct({ value: Schema.Number })
export type DirectModel = typeof DirectModel.Type

export const DirectMessage = defineMessageUnion({
  RequestedReadDirectValue: {},
  CompletedReadDirectValue: { value: Schema.Number },
})
export type DirectMessage = typeof DirectMessage.Type

const DeclarationTestsDirect = Block.define('DeclarationTestsDirect', {
  Model: DirectModel,
  Message: DirectMessage,
})
const directComposition = DeclarationTestsDirect.register({})

export const ReadDirectValue = directComposition.command('ReadDirectValue', {
  messages: [DirectMessage.CompletedReadDirectValue],
  handler: function* () {
    const clock = yield* Clock

    return () =>
      clock.now.pipe(
        Effect.map(value => DirectMessage.CompletedReadDirectValue({ value })),
      )
  },
})

export const ObserveDirectValue = directComposition.mount(
  'ObserveDirectValue',
  {
    messages: [DirectMessage.CompletedReadDirectValue],
  },
)

export const StreamDirectValue = directComposition.mountStream(
  'StreamDirectValue',
  {
    messages: [DirectMessage.CompletedReadDirectValue],
  },
)

export const directUpdate = directComposition.update((model, message) =>
  DirectMessage.match(message, {
    RequestedReadDirectValue: () => ({
      model,
      commands: [ReadDirectValue()],
    }),
    CompletedReadDirectValue: ({ value }) => ({
      model: DirectModel.make({ value }),
    }),
  }),
)

export const refreshDirectValue = directComposition.step(model => ({
  model,
  commands: [ReadDirectValue()],
}))

export const Direct = directComposition.assemble({
  init: () => ({ model: DirectModel.make({ value: 0 }) }),
  update: directUpdate,
  steps: { refreshDirectValue },
  EffectsLayer: ReadDirectValue.layer,
})

export const ParentModel = Schema.Struct({ child: ChildModel })
export type ParentModel = typeof ParentModel.Type

export const ParentMessage = defineMessageUnion({
  // eslint-disable-next-line foldkit/got-prefix-requires-block-payload
  GotChildMessage: { message: ChildMessage },
  RequestedRefresh: {},
})
export type ParentMessage = typeof ParentMessage.Type

export const child = Child.connection({
  placement: 'child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (_model: ParentModel, nextChild: ChildModel) =>
    ParentModel.make({ child: nextChild }),
  parentMessage: ParentMessage.GotChildMessage,
})

export const directChild = Child.connection({
  Model: ParentModel,
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})

type DirectPlacementIsExact = Expect<
  Equal<typeof directChild.placement, 'child'>
>

type BoundRefreshRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<ReturnType<typeof child.refresh>>,
    Block.Scoped<'child', Command.HandlerOf<typeof ReadCount>>
  >
>

const parentBase = Block.define('DeclarationTestsParent').define({
  Model: ParentModel,
  Message: ParentMessage,
})
const parentDefinition = parentBase.register({ children: [child] })

const parentView = parentDefinition.view((model, h) =>
  h.block(child.embedView({ slotId: 'child', model: model.child })),
)

export const parentUpdate = parentBase.update((model, message) =>
  ParentMessage.match(message, {
    GotChildMessage: ({ message }) => child.fold(model, message),
    RequestedRefresh: () => child.refresh()(model),
  }),
)

const refreshChild = parentBase.step(model => child.refresh()(model))

export const RefreshContext = Schema.Struct({
  source: Schema.Literals(['Manual']),
})
export type RefreshContext = typeof RefreshContext.Type

export const contextualRefreshChild = parentBase.step(
  (model, _context?: RefreshContext) => child.refresh()(model),
)

export const Parent = parentDefinition.assemble({
  init: () => {
    const childInit = child.init()

    return {
      model: ParentModel.make({ child: childInit.model }),
      commands: childInit.commands,
    }
  },
  update: parentUpdate,
  view: parentView,
  steps: { refreshChild },
  EffectsLayer: Layer.empty,
})

type ParentServicesAreExact = Expect<
  Equal<Layer.Services<typeof Parent.EffectsLayer>, Clock>
>
type ParentErrorIsExact = Expect<
  Equal<Layer.Error<typeof Parent.EffectsLayer>, 'HandlerUnavailable'>
>

export type ParentAssertions = [
  BoundRefreshRequirementsAreExact,
  DirectPlacementIsExact,
  ParentServicesAreExact,
  ParentErrorIsExact,
]

const DeclarationTestsChoice = Block.define('DeclarationTestsChoice')

const makeChoice = <const Values extends ReadonlyArray<string>>(
  Value: Schema.Literals<Values>,
) => {
  type Value = Values[number]
  const Model = Schema.Struct({ value: Value })
  const Message = Schema.TaggedStruct('SelectedValue', { value: Value })
  const OutMessage = Schema.TaggedStruct('SelectedValue', { value: Value })
  const definition = DeclarationTestsChoice.define({
    Model,
    Message,
    OutMessage,
  })
  const finish = definition.step((_model, value: Value) => ({
    model: Model.make({ value }),
    outMessage: OutMessage.make({ value }),
  }))

  return definition.assemble({
    init: (value: Value) => ({ model: Model.make({ value }) }),
    update: definition.update((_model, message) => ({
      model: Model.make({ value: message.value }),
      outMessage: OutMessage.make({ value: message.value }),
    })),
    steps: { finish },
    EffectsLayer: Layer.empty,
  })
}

export const RefinedChoice = makeChoice(Schema.Literals(['One', 'Two']))
export type RefinedChoiceModel = typeof RefinedChoice.Model.Type
export type RefinedChoiceMessage = typeof RefinedChoice.Message.Type
export type RefinedChoiceOutMessage = typeof RefinedChoice.OutMessage.Type

type RefinedValueIsExact = Expect<
  Equal<RefinedChoiceOutMessage['value'], 'One' | 'Two'>
>

type ChoiceParent = Readonly<{ choice: RefinedChoiceModel }>

export const refinedChoice = RefinedChoice.connection({
  placement: 'refined-choice',
  read: (model: ChoiceParent) => Option.some(model.choice),
  write: (_model: ChoiceParent, nextChoice: RefinedChoiceModel) => ({
    choice: nextChoice,
  }),
  toParentMessage: (message: RefinedChoiceMessage) => message,
  outMessage: {
    fold: (outMessage: RefinedChoiceOutMessage) => (model: ChoiceParent) => ({
      model,
      outMessage,
    }),
  },
})

type RefinedFoldIsExact = Expect<
  Equal<
    ReturnType<typeof refinedChoice.fold>['outMessage'],
    RefinedChoiceOutMessage | undefined
  >
>

export type RefinedAssertions = [RefinedValueIsExact, RefinedFoldIsExact]

const ClockLayer = Layer.succeed(Clock, { now: Effect.succeed(1) })

const Application = defineApplication({
  Model: ParentModel,
  Message: ParentMessage,
})
const PureApplication = defineApplication({
  Model: ParentModel,
  Message: ParentMessage,
})
const preserveFunction = <Args extends ReadonlyArray<unknown>, ReturnValue>(
  fn: (...args: Args) => ReturnValue,
) => ({ fn })
const wrappedPureUpdate = preserveFunction(
  (
    model: ParentModel,
    message: ParentMessage,
  ): Update.Return<ParentModel, ParentMessage> => {
    void message
    return { model }
  },
)
const pureInit = () => ({
  model: ParentModel.make({ child: Child.Model.make({ value: 0 }) }),
})
const pureElementView = PureApplication.view((_model, h) => h.main([]))
const pureDocumentView = PureApplication.view((_model, h) => ({
  title: 'Pure application',
  body: h.main([]),
}))
const pureElementProgram: ElementProgram<undefined, never, never, never> =
  PureApplication.makeElement({
    container: null,
    init: pureInit,
    update: PureApplication.update(wrappedPureUpdate.fn),
    view: pureElementView,
  })
const purePageProgram: ApplicationProgram<
  undefined,
  void,
  never,
  never,
  never
> = PureApplication.make({
  container: null,
  init: pureInit,
  update: PureApplication.update(wrappedPureUpdate.fn),
  view: pureDocumentView,
})
void pureElementProgram
void purePageProgram
export const ReadApplicationValue = Application.command(
  'ReadApplicationValue',
  {
    messages: [ParentMessage.RequestedRefresh],
  },
)
export const ObserveApplicationValue = Application.mount(
  'ObserveApplicationValue',
  {
    messages: [ParentMessage.RequestedRefresh],
  },
)
export const StreamApplicationValue = Application.mountStream(
  'StreamApplicationValue',
  {
    messages: [ParentMessage.RequestedRefresh],
  },
)
const applicationComposition = Application.register({
  children: [directChild],
})
const applicationElementView = applicationComposition.view((model, h) =>
  h.block(directChild.embedView({ slotId: 'child', model: model.child })),
)
const applicationDocumentView = applicationComposition.view((model, h) => ({
  title: 'Declaration test',
  body: h.block(directChild.embedView({ slotId: 'child', model: model.child })),
}))
const applicationUpdate = Application.update((model, message) =>
  ParentMessage.match(message, {
    GotChildMessage: ({ message }) => directChild.fold(model, message),
    RequestedRefresh: () => directChild.refresh()(model),
  }),
)

const applicationInit = () => {
  const childInit = directChild.init()

  return {
    model: ParentModel.make({ child: childInit.model }),
    commands: childInit.commands,
  }
}

const applicationImplementation = {
  init: applicationInit,
  update: applicationUpdate,
  EffectsLayer: Layer.empty,
}

export const makeProgram = (container: HTMLElement) =>
  provide(
    applicationComposition.makeElement({
      ...applicationImplementation,
      container,
      view: applicationElementView,
    }),
    ClockLayer,
  )

export const makePageProgram = (container: HTMLElement | null) =>
  provide(
    applicationComposition.make({
      ...applicationImplementation,
      container,
      view: applicationDocumentView,
    }),
    ClockLayer,
  )

export const renderPage = () =>
  Server.renderToString(
    applicationComposition,
    { ...applicationImplementation, view: applicationDocumentView },
    { isHydratable: false },
  )
