import { Context, Effect, Layer, Option, Schema } from 'effect'
import {
  type Application as ApplicationProgram,
  type Element as ElementProgram,
  define as defineApplication,
} from 'foldkit/application'
import * as Block from 'foldkit/block'
import * as Command from 'foldkit/command'
import { Server } from 'foldkit/experimental'
import { defineMessageUnion } from 'foldkit/message'
import * as Port from 'foldkit/port'
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

const DeclarationTestsChildDefinition = Block.define('DeclarationTestsChild')

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

export const ReadCount = DeclarationTestsChildDefinition.command('ReadCount', {
  messages: [ChildMessage.CompletedRead],
  handler: function* () {
    const clock = yield* Clock
    yield* handlerConstruction

    return () =>
      clock.now.pipe(Effect.map(value => ChildMessage.CompletedRead({ value })))
  },
})

export const Measure = DeclarationTestsChildDefinition.mount('Measure', {
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

const ChildDefinition = DeclarationTestsChildDefinition.define({
  Model: ChildModel,
  Message: ChildMessage,
})
const RegisteredChildDefinition = ChildDefinition.toComposition({
  mounts: [Measure],
})

const childView = RegisteredChildDefinition.view((model, h) =>
  h.div([h.OnMount(Measure())], [globalThis.String(model.value)]),
)

const childUpdate = ChildDefinition.update((model, message) =>
  ChildMessage.match(message, {
    RequestedRead: () => ({ model, commands: [ReadCount()] }),
    CompletedRead: ({ value }) => ({
      model: ChildModel.make({ value }),
    }),
    CompletedMeasure: () => ({ model }),
  }),
)

const refresh = ChildDefinition.step(model => ({
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

export type ChildLayerAssertions = [
  ChildServicesAreExact,
  ChildErrorIsExact,
  CompletedChildIsExact,
]

const childImplementation = {
  init: () => ({ model: ChildModel.make({ value: 0 }) }),
  update: childUpdate,
  view: childView,
  expose: { refresh },
  EffectsLayer: ChildEffectsLayer,
}

export type CompletedChild = Block.Completed<
  typeof RegisteredChildDefinition,
  typeof childImplementation
>

export const Child = RegisteredChildDefinition.toBlock(childImplementation)

type CompletedChildIsExact = Expect<Equal<CompletedChild, typeof Child>>

export const DirectModel = Schema.Struct({ value: Schema.Number })
export type DirectModel = typeof DirectModel.Type

export const DirectMessage = defineMessageUnion({
  RequestedReadDirectValue: {},
  CompletedReadDirectValue: { value: Schema.Number },
})
export type DirectMessage = typeof DirectMessage.Type

const DeclarationTestsDirectDefinition = Block.define(
  'DeclarationTestsDirect',
  {
    Model: DirectModel,
    Message: DirectMessage,
  },
)
const RegisteredDeclarationTestsDirectDefinition =
  DeclarationTestsDirectDefinition.toComposition({})

export const ReadDirectValue =
  RegisteredDeclarationTestsDirectDefinition.command('ReadDirectValue', {
    messages: [DirectMessage.CompletedReadDirectValue],
    handler: function* () {
      const clock = yield* Clock

      return () =>
        clock.now.pipe(
          Effect.map(value =>
            DirectMessage.CompletedReadDirectValue({ value }),
          ),
        )
    },
  })

export const ObserveDirectValue =
  RegisteredDeclarationTestsDirectDefinition.mount('ObserveDirectValue', {
    messages: [DirectMessage.CompletedReadDirectValue],
  })

export const StreamDirectValue =
  RegisteredDeclarationTestsDirectDefinition.mountStream('StreamDirectValue', {
    messages: [DirectMessage.CompletedReadDirectValue],
  })

export const directUpdate = RegisteredDeclarationTestsDirectDefinition.update(
  (model, message) =>
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

export const refreshDirectValue =
  RegisteredDeclarationTestsDirectDefinition.step(model => ({
    model,
    commands: [ReadDirectValue()],
  }))

export const Direct = RegisteredDeclarationTestsDirectDefinition.toBlock({
  init: () => ({ model: DirectModel.make({ value: 0 }) }),
  update: directUpdate,
  expose: { refreshDirectValue },
  EffectsLayer: ReadDirectValue.layer,
})

const DeclarationTestsPureDefinition = Block.define('DeclarationTestsPure', {
  Model: DirectModel,
  Message: DirectMessage,
})
const DeclarationTestsPureComposition =
  DeclarationTestsPureDefinition.toComposition()
const pureImplementation = {
  init: () => ({ model: DirectModel.make({ value: 0 }) }),
  update: DeclarationTestsPureDefinition.update((model, _message) => ({
    model,
  })),
}

export type CompletedPure = Block.Completed<
  typeof DeclarationTestsPureComposition,
  typeof pureImplementation
>

export const Pure = DeclarationTestsPureComposition.toBlock(pureImplementation)

type CompletedPureIsExact = Expect<Equal<CompletedPure, typeof Pure>>

export type PureCompletionAssertion = CompletedPureIsExact

export const ParentModel = Schema.Struct({ child: ChildModel })
export type ParentModel = typeof ParentModel.Type

export const ParentMessage = defineMessageUnion({
  // eslint-disable-next-line foldkit/got-prefix-requires-block-payload
  GotChildMessage: { message: ChildMessage },
  RequestedRefresh: {},
})
export type ParentMessage = typeof ParentMessage.Type

const DeclarationTestsParentDefinition = Block.define(
  'DeclarationTestsParent',
).define({
  Model: ParentModel,
  Message: ParentMessage,
})

export const child = DeclarationTestsParentDefinition.bindChild(Child, {
  placement: 'child',
  read: model => Option.some(model.child),
  write: (_model, nextChild) => ParentModel.make({ child: nextChild }),
  parentMessage: ParentMessage.GotChildMessage,
})

export const directChild = DeclarationTestsParentDefinition.bindChild(Child, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})

export const childInspection = Block.inspectBinding(child)

type DirectPlacementIsExact = Expect<
  Equal<typeof directChild.placement, 'child'>
>

type BoundRefreshRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<ReturnType<typeof child.refresh>>,
    Block.Scoped<'child', Command.HandlerOf<typeof ReadCount>>
  >
>
type BoundRefreshEvidenceIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<ReturnType<typeof child.refresh>>>,
    Block.BindingRequirement<'child', typeof Child>
  >
>
type ChildBindingStringKeysAreExact = Expect<
  Equal<
    Extract<keyof typeof child, string>,
    'placement' | 'init' | 'fold' | 'embedView' | 'refresh'
  >
>
type ChildInspectionServicesAreExact = Expect<
  Equal<Layer.Services<typeof childInspection.EffectsLayer>, Clock>
>
type ChildInspectionErrorIsExact = Expect<
  Equal<Layer.Error<typeof childInspection.EffectsLayer>, 'HandlerUnavailable'>
>
type ChildInspectionMountsAreExact = Expect<
  Equal<(typeof childInspection.mounts)[number], typeof Measure>
>

export const ObserveParent = DeclarationTestsParentDefinition.mount(
  'ObserveParent',
  {
    messages: [ParentMessage.RequestedRefresh],
    handler: function* () {
      return () => Effect.succeed(ParentMessage.RequestedRefresh())
    },
  },
)
export const ParentComposition = DeclarationTestsParentDefinition.toComposition(
  {
    children: [child],
    mounts: [ObserveParent],
  },
)

const parentView = ParentComposition.view((model, h) =>
  h.div(
    [h.OnMount(ObserveParent())],
    [h.block(child.embedView({ slotId: 'child', model: model.child }))],
  ),
)

export const parentModelRender = ParentComposition.render((model, h) =>
  h.div(
    [h.OnClick(ParentMessage.RequestedRefresh()), h.OnMount(ObserveParent())],
    [h.block(child.embedView({ slotId: 'child', model: model.child }))],
  ),
)

export const parentBuilderRender = ParentComposition.render.builder(h =>
  h.div([h.OnMount(ObserveParent())]),
)

export const parentInputRender =
  ParentComposition.render.withInput<ChildModel>()((childModel, h) =>
    h.block(child.embedView({ slotId: 'child-input', model: childModel })),
  )

export const parentArrayRender = ParentComposition.render.withInput<
  ReadonlyArray<string>
>()((labels, h) => labels.map(label => h.span([], [label])))

export const parentUpdate = DeclarationTestsParentDefinition.update(
  (model, message) =>
    ParentMessage.match(message, {
      GotChildMessage: ({ message }) => child.fold(model, message),
      RequestedRefresh: () => child.refresh()(model),
    }),
)

const refreshChild = DeclarationTestsParentDefinition.step(model =>
  child.refresh()(model),
)

export const RefreshContext = Schema.Struct({
  source: Schema.Literals(['Manual']),
})
export type RefreshContext = typeof RefreshContext.Type

export const contextualRefreshChild = DeclarationTestsParentDefinition.step(
  (model, _context?: RefreshContext) => child.refresh()(model),
)

export const Parent = ParentComposition.toBlock({
  init: () => {
    const childInit = child.init()

    return {
      model: ParentModel.make({ child: childInit.model }),
      commands: childInit.commands,
    }
  },
  update: parentUpdate,
  view: parentView,
  expose: { refreshChild },
  EffectsLayer: ObserveParent.layer,
})

type ParentServicesAreExact = Expect<
  Equal<Layer.Services<typeof Parent.EffectsLayer>, Clock>
>
type ParentErrorIsExact = Expect<
  Equal<Layer.Error<typeof Parent.EffectsLayer>, 'HandlerUnavailable'>
>

export type ParentAssertions = [
  BoundRefreshRequirementsAreExact,
  BoundRefreshEvidenceIsExact,
  ChildBindingStringKeysAreExact,
  ChildInspectionServicesAreExact,
  ChildInspectionErrorIsExact,
  ChildInspectionMountsAreExact,
  DirectPlacementIsExact,
  ParentServicesAreExact,
  ParentErrorIsExact,
]

const DeclarationTestsChoiceDefinition = Block.define('DeclarationTestsChoice')

const makeChoiceParts = <const Values extends ReadonlyArray<string>>(
  Value: Schema.Literals<Values>,
) => {
  type Value = Values[number]
  const Model = Schema.Struct({ value: Value })
  const Message = Schema.TaggedStruct('SelectedValue', { value: Value })
  const OutMessage = Schema.TaggedStruct('SelectedValue', { value: Value })
  const definition = DeclarationTestsChoiceDefinition.define({
    Model,
    Message,
    OutMessage,
  })
  const finish = definition.step((_model, value: Value) => ({
    model: Model.make({ value }),
    outMessage: OutMessage.make({ value }),
  }))

  const implementation = {
    init: (value: Values[number]) => ({ model: Model.make({ value }) }),
    update: definition.update((_model, message) => ({
      model: Model.make({ value: message.value }),
      outMessage: OutMessage.make({ value: message.value }),
    })),
    expose: { finish },
    EffectsLayer: Layer.empty,
  }

  return {
    composition: definition.toComposition(),
    implementation,
  }
}

type ChoiceParts<Values extends ReadonlyArray<string>> = ReturnType<
  typeof makeChoiceParts<Values>
>

export type CompletedChoice<Values extends ReadonlyArray<string>> =
  Block.Completed<
    ChoiceParts<Values>['composition'],
    ChoiceParts<Values>['implementation']
  >

const makeChoice = <const Values extends ReadonlyArray<string>>(
  Value: Schema.Literals<Values>,
): CompletedChoice<Values> => {
  const { composition, implementation } = makeChoiceParts(Value)

  return composition.toBlock(implementation)
}

export const RefinedChoice = makeChoice(Schema.Literals(['One', 'Two']))
export type RefinedChoiceModel = typeof RefinedChoice.Model.Type
export type RefinedChoiceMessage = typeof RefinedChoice.Message.Type
export type RefinedChoiceOutMessage = typeof RefinedChoice.OutMessage.Type

type RefinedValueIsExact = Expect<
  Equal<RefinedChoiceOutMessage['value'], 'One' | 'Two'>
>
type CompletedChoiceIsExact = Expect<
  Equal<CompletedChoice<readonly ['One', 'Two']>, typeof RefinedChoice>
>

const ChoiceParent = Schema.Struct({ choice: RefinedChoice.Model })
type ChoiceParent = typeof ChoiceParent.Type
const ChoiceParentDefinition = Block.define('DeclarationTestsChoiceParent', {
  Model: ChoiceParent,
  Message: RefinedChoice.Message,
  OutMessage: RefinedChoice.OutMessage,
})

export const refinedChoice = ChoiceParentDefinition.bindChild(RefinedChoice, {
  placement: 'refined-choice',
  read: model => Option.some(model.choice),
  write: (_model, nextChoice) => ChoiceParent.make({ choice: nextChoice }),
  toParentMessage: message => message,
  outMessage: {
    fold: outMessage => model => ({ model, outMessage }),
  },
})

type RefinedFoldIsExact = Expect<
  Equal<
    ReturnType<typeof refinedChoice.fold>['outMessage'],
    RefinedChoiceOutMessage | undefined
  >
>

export type RefinedAssertions = [
  RefinedValueIsExact,
  RefinedFoldIsExact,
  CompletedChoiceIsExact,
]

const ClockLayer = Layer.succeed(Clock, { now: Effect.succeed(1) })

export class ProvisionDependency extends Context.Service<
  ProvisionDependency,
  Readonly<{ value: number }>
>()('DeclarationTestsProvisionDependency') {}

export class ProvisionExtra extends Context.Service<
  ProvisionExtra,
  Readonly<{ value: number }>
>()('DeclarationTestsProvisionExtra') {}

export const ProvisionDependencyLayer = Layer.succeed(ProvisionDependency, {
  value: 2,
})

const ClockAndExtraLayer = Layer.merge(
  Layer.effect(
    Clock,
    Effect.map(ProvisionDependency, ({ value }) => ({
      now: Effect.succeed(value),
    })),
  ),
  Layer.effect(
    ProvisionExtra,
    Effect.map(ProvisionDependency, ({ value }) => ({ value: value + 1 })),
  ),
)

const ProvisionFlags = Schema.Struct({ initialValue: Schema.Number })
export type ProvisionFlags = typeof ProvisionFlags.Type

export const provisionPorts = {
  inbound: { valueChanged: Port.inbound(Schema.String) },
  outbound: { valueRead: Port.outbound(Schema.Number) },
}

const ApplicationDefinition = defineApplication({
  Model: ParentModel,
  Message: ParentMessage,
})
const PureApplicationDefinition = ApplicationDefinition
const PureApplicationComposition = PureApplicationDefinition.toComposition()
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
const pureElementView = PureApplicationDefinition.view((_model, h) =>
  h.main([]),
)
const pureDocumentView = PureApplicationDefinition.view((_model, h) => ({
  title: 'Pure application',
  body: h.main([]),
}))
const pureElementProgram: ElementProgram<undefined, never, never, never> =
  PureApplicationComposition.makeElement({
    container: null,
    init: pureInit,
    update: PureApplicationDefinition.update(wrappedPureUpdate.fn),
    view: pureElementView,
  })
const purePageProgram: ApplicationProgram<
  undefined,
  void,
  never,
  never,
  never
> = PureApplicationComposition.make({
  container: null,
  init: pureInit,
  update: PureApplicationDefinition.update(wrappedPureUpdate.fn),
  view: pureDocumentView,
})
void pureElementProgram
void purePageProgram
export const ReadApplicationValue = ApplicationDefinition.command(
  'ReadApplicationValue',
  {
    messages: [ParentMessage.RequestedRefresh],
  },
)
export const ObserveApplicationValue = ApplicationDefinition.mount(
  'ObserveApplicationValue',
  {
    messages: [ParentMessage.RequestedRefresh],
  },
)
export const StreamApplicationValue = ApplicationDefinition.mountStream(
  'StreamApplicationValue',
  {
    messages: [ParentMessage.RequestedRefresh],
  },
)
export const ApplicationComposition = ApplicationDefinition.toComposition({
  children: [directChild],
})
const applicationElementView = ApplicationComposition.view((model, h) =>
  h.block(directChild.embedView({ slotId: 'child', model: model.child })),
)
const applicationDocumentView = ApplicationComposition.view((model, h) => ({
  title: 'Declaration test',
  body: h.block(directChild.embedView({ slotId: 'child', model: model.child })),
}))
export const applicationModelRender = ApplicationComposition.render(
  (model, h) =>
    h.block(
      directChild.embedView({
        slotId: 'application-child',
        model: model.child,
      }),
    ),
)
export const applicationBuilderRender = ApplicationComposition.render.builder(
  h => h.main([]),
)
export const applicationInputRender =
  ApplicationComposition.render.withInput<ChildModel>()((childModel, h) =>
    h.block(
      directChild.embedView({
        slotId: 'application-input-child',
        model: childModel,
      }),
    ),
  )
const applicationUpdate = ApplicationDefinition.update((model, message) =>
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

const makeInferredProvisionPageAwaitingDependency = (
  container: HTMLElement | null,
) =>
  PureApplicationComposition.make({
    Flags: ProvisionFlags,
    container,
    init: ({ initialValue }: typeof ProvisionFlags.Type) => ({
      model: ParentModel.make({
        child: Child.Model.make({ value: initialValue }),
      }),
    }),
    ports: provisionPorts,
    update: PureApplicationDefinition.update(wrappedPureUpdate.fn),
    view: pureDocumentView,
  }).provide(ClockAndExtraLayer)

type ProvisionPage = ApplicationProgram<
  typeof provisionPorts,
  ProvisionFlags,
  ProvisionDependency,
  never,
  Clock | ProvisionExtra
>

type ProvisionPageIsExact = Expect<
  Equal<
    ReturnType<typeof makeInferredProvisionPageAwaitingDependency>,
    ProvisionPage
  >
>

export const makeProvisionPageAwaitingDependency: (
  container: HTMLElement | null,
) => ProvisionPage = makeInferredProvisionPageAwaitingDependency

const makeInferredProvisionElement = (container: HTMLElement | null) =>
  PureApplicationComposition.makeElement({
    container,
    init: pureInit,
    ports: provisionPorts,
    update: PureApplicationDefinition.update(wrappedPureUpdate.fn),
    view: pureElementView,
  })
    .provide(ClockAndExtraLayer)
    .provide(ProvisionDependencyLayer)

type ProvisionElement = ElementProgram<
  typeof provisionPorts,
  never,
  never,
  Clock | ProvisionExtra | ProvisionDependency
>

type ProvisionElementIsExact = Expect<
  Equal<ReturnType<typeof makeInferredProvisionElement>, ProvisionElement>
>

export const makeProvisionElement: (
  container: HTMLElement | null,
) => ProvisionElement = makeInferredProvisionElement

type ProvisionAssertions = [ProvisionPageIsExact, ProvisionElementIsExact]
const provisionAssertions: ProvisionAssertions = [true, true]
void provisionAssertions

export const makeProgram = (container: HTMLElement) =>
  ApplicationComposition.makeElement({
    ...applicationImplementation,
    container,
    view: applicationElementView,
  }).provide(ClockLayer)

export const makePageProgram = (container: HTMLElement | null) =>
  ApplicationComposition.make({
    ...applicationImplementation,
    container,
    view: applicationDocumentView,
  }).provide(ClockLayer)

export const renderPage = () =>
  Server.renderToString(
    ApplicationComposition,
    { ...applicationImplementation, view: applicationDocumentView },
    { isHydratable: false },
  )
