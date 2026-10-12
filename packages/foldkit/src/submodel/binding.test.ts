import { Context, Effect, Layer, Option, Schema } from 'effect'
import { expect, expectTypeOf } from 'vitest'

import { describe, it } from '@effect/vitest'

import * as Command from '../command/index.js'
import type { SubmodelConfig } from '../html/submodel.js'
import * as ManagedResource from '../managedResource/index.js'
import { defineMessageUnion } from '../message/index.js'
import * as Mount from '../mount/index.js'
import { modifyFields } from '../struct/index.js'
import * as Subscription from '../subscription/subscription.js'
import * as Update from '../update/index.js'
import { aggregateChildren, bind } from './binding.js'
import { type Owner, owner } from './owner.js'

const ChildOwner = owner('Binding/Child')

const ChildModel = Schema.Struct({ count: Schema.Number })
type ChildModel = typeof ChildModel.Type

const ChildMessage = defineMessageUnion({
  ChangedCount: { amount: Schema.Number },
  ReportedCount: {},
  CompletedSave: {},
  ObservedTick: {},
  AcquiredSession: { value: Schema.String },
  ReleasedSession: {},
  FailedAcquireSession: {},
  CompletedMeasure: {},
})
type ChildMessage = typeof ChildMessage.Type

const ChildOutMessage = defineMessageUnion({
  Reported: { value: Schema.Number },
})
type ChildOutMessage = typeof ChildOutMessage.Type

const Save = Command.define(ChildOwner.name('Save'), {
  messages: [ChildMessage.CompletedSave],
})

const childSubscriptions = Subscription.make<ChildModel, ChildMessage>()(
  entry => ({
    ticks: entry(
      ChildOwner.name('ObserveTicks'),
      { count: Schema.Number },
      {
        messages: [ChildMessage.ObservedTick],
        modelToDependencies: model => ({ count: model.count }),
      },
    ),
  }),
)

const Session = ManagedResource.tag<string>()('Binding/Child/Session')

const childManagedResources = ManagedResource.make<ChildModel, ChildMessage>()(
  entry => ({
    session: entry(
      ChildOwner.name('ManageSession'),
      Schema.Option(Schema.String),
      {
        resource: Session,
        modelToMaybeRequirements: model =>
          model.count === 0 ? Option.none() : Option.some(`${model.count}`),
        onAcquired: value => ChildMessage.AcquiredSession({ value }),
        onReleased: ChildMessage.ReleasedSession,
        onAcquireError: () => ChildMessage.FailedAcquireSession(),
      },
    ),
  }),
)

const Measure = Mount.define(ChildOwner.name('Measure'), {
  messages: [ChildMessage.CompletedMeasure],
})

const ChildDefinition = ChildOwner.define({
  Model: ChildModel,
  Message: ChildMessage,
  OutMessage: ChildOutMessage,
  mounts: [Measure],
})

const childView = ChildDefinition.defineView((model, h) =>
  h.div([], [`Count ${model.count}`]),
)

const detailedChildView = ChildDefinition.defineView.withInputs<
  Readonly<{ prefix: string }>
>((model, viewInputs, h) => h.div([], [`${viewInputs.prefix} ${model.count}`]))

const childUpdate = ChildDefinition.defineUpdate(
  (model, message, context: Readonly<{ roomId: string }>) =>
    ChildMessage.match(message, {
      ChangedCount: ({ amount }) => ({
        model: modifyFields(model, {
          count: () => model.count + amount + context.roomId.length,
        }),
      }),
      ReportedCount: () => ({
        model,
        outMessage: ChildOutMessage.Reported({ value: model.count }),
      }),
      CompletedSave: () => ({ model }),
      ObservedTick: () => ({ model }),
      AcquiredSession: () => ({ model }),
      ReleasedSession: () => ({ model }),
      FailedAcquireSession: () => ({ model }),
      CompletedMeasure: () => ({ model }),
    }),
)

const save = ChildDefinition.defineStep((model: ChildModel) => ({
  model,
  commands: [Save()],
}))

const reset = ChildDefinition.defineStep((model: ChildModel) => ({
  model: modifyFields(model, { count: () => 0 }),
}))

const addForRoom = ChildDefinition.defineStep(
  (
    model: ChildModel,
    amount: number,
    context: Readonly<{ roomId: string }>,
  ) => ({
    model: modifyFields(model, {
      count: () => model.count + amount + context.roomId.length,
    }),
  }),
)

const report = ChildDefinition.defineStep((model: ChildModel) => ({
  model,
  outMessage: ChildOutMessage.Reported({ value: model.count }),
}))

const Child = ChildDefinition.compose({
  view: childView,
  init: (count: number) => ({ model: ChildModel.make({ count }) }),
  update: childUpdate,
  steps: { save, reset, addForRoom, report },
  subscriptions: childSubscriptions,
  managedResources: childManagedResources,
  EffectsLayer: Layer.empty,
  hostHandlers: [
    Save,
    childSubscriptions.ticks,
    childManagedResources.session,
    Measure,
  ],
})

type ParentModel = Readonly<{
  maybeChild: Option.Option<ChildModel>
  reports: ReadonlyArray<number>
  isListening: boolean
}>

const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
  RecordedReport: {},
})
type ParentMessage = typeof ParentMessage.Type

const ParentOutMessage = defineMessageUnion({
  ForwardedReport: { value: Schema.Number },
  DerivedReport: { value: Schema.Number },
})
type ParentOutMessage = typeof ParentOutMessage.Type

const toParentMessage = (message: ChildMessage): ParentMessage =>
  ParentMessage.GotChildMessage({ message })

const foldChildOutMessage = ChildOutMessage.match<
  Update.StepWithOutMessage<ParentModel, ParentMessage, ParentOutMessage>
>({
  Reported:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        reports: reports => [...reports, value],
      }),
      outMessage: ParentOutMessage.DerivedReport({ value }),
    }),
})

const forwardChildOutMessage = ChildOutMessage.match<
  ParentOutMessage | undefined
>({
  Reported: ({ value }) => ParentOutMessage.ForwardedReport({ value }),
})

const writeChild = (
  model: ParentModel,
  nextChildModel: ChildModel,
): ParentModel =>
  modifyFields(model, { maybeChild: () => Option.some(nextChildModel) })

const home = Child.bind({
  placement: 'home',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage,
  outMessage: {
    fold: foldChildOutMessage,
    forward: forwardChildOutMessage,
  },
  subscriptions: {
    when: {
      ticks: (model: ParentModel) => model.isListening,
    },
  },
})

const foldChildOutMessageWithCommand = (
  outMessage: ChildOutMessage,
  { liftCommand }: Update.FoldContext<ChildMessage, ParentMessage>,
) =>
  ChildOutMessage.match<
    Update.StepWithOutMessage<
      ParentModel,
      ParentMessage,
      ParentOutMessage,
      Command.HandlerOf<typeof Save>
    >,
    ChildOutMessage
  >(outMessage, {
    Reported:
      ({ value }) =>
      model => ({
        model,
        commands: [liftCommand(Save())],
        outMessage: ParentOutMessage.DerivedReport({ value }),
      }),
  })

const commandHome = Child.bind({
  placement: 'command-home',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage,
  outMessage: { fold: foldChildOutMessageWithCommand },
})

const PolicyMessage = defineMessageUnion({ CompletedPolicyWork: {} })
type PolicyMessage = typeof PolicyMessage.Type

const ParentPolicyOwner = owner('Binding/ParentPolicy')
const RunPolicyWork = Command.define(ParentPolicyOwner.name('RunPolicyWork'), {
  messages: [PolicyMessage.CompletedPolicyWork],
})

const foldChildOutMessageWithParentCommand = ChildOutMessage.match<
  Update.StepWithOutMessage<
    ParentModel,
    PolicyMessage,
    ParentOutMessage,
    Command.HandlerOf<typeof RunPolicyWork>
  >
>({
  Reported:
    ({ value }) =>
    model => ({
      model,
      commands: [RunPolicyWork()],
      outMessage: ParentOutMessage.DerivedReport({ value }),
    }),
})

const parentCommandHome = Child.bind({
  placement: 'parent-command-home',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage,
  outMessage: { fold: foldChildOutMessageWithParentCommand },
})

const forwardOnlyHome = Child.bind({
  placement: 'forward-only-home',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage,
  outMessage: { forward: forwardChildOutMessage },
})

const bindWithoutOutMessagePolicy = () =>
  // @ts-expect-error an OutMessage descriptor requires an explicit parent policy
  Child.bind({
    placement: 'missing-policy',
    read: (model: ParentModel) => model.maybeChild,
    write: writeChild,
    toParentMessage,
  })
void bindWithoutOutMessagePolicy

const bindWithDroppingForward = () =>
  // @ts-expect-error a supplied forward must produce a parent OutMessage
  Child.bind({
    placement: 'dropping-forward',
    read: (model: ParentModel) => model.maybeChild,
    write: writeChild,
    toParentMessage,
    outMessage: {
      fold: foldChildOutMessage,
      forward: () => undefined,
    },
  })
void bindWithDroppingForward

const bindWithAnyForward = () =>
  // @ts-expect-error an any return would erase the parent OutMessage contract
  Child.bind({
    placement: 'any-forward',
    read: (model: ParentModel) => model.maybeChild,
    write: writeChild,
    toParentMessage,
    outMessage: { forward: () => JSON.parse('{}') },
  })
void bindWithAnyForward

const bindWithUnknownForward = () =>
  // @ts-expect-error an unknown return would erase the parent OutMessage contract
  Child.bind({
    placement: 'unknown-forward',
    read: (model: ParentModel) => model.maybeChild,
    write: writeChild,
    toParentMessage,
    outMessage: { forward: (): unknown => undefined },
  })
void bindWithUnknownForward

const locallyHandledWithoutForwarding = Child.bind({
  placement: 'locally-handled',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage,
  outMessage: { fold: foldChildOutMessage },
})
void locallyHandledWithoutForwarding

const initialParent: ParentModel = {
  maybeChild: Option.some(ChildModel.make({ count: 2 })),
  reports: [],
  isListening: true,
}

const callFoldDataLast = () =>
  // @ts-expect-error fold executes immediately and requires the parent Model
  home.fold(ChildMessage.ChangedCount({ amount: 3 }), { roomId: 'room' })
void callFoldDataLast

const ArityModel = Schema.Struct({ count: Schema.Number })
type ArityModel = typeof ArityModel.Type

const ArityMessage = defineMessageUnion({ IncreasedCount: {} })
type ArityMessage = typeof ArityMessage.Type

type ArityParent = Readonly<{ child: ArityModel }>

const initialArityParent: ArityParent = {
  child: ArityModel.make({ count: 0 }),
}

const readArityChild = (model: ArityParent) => Option.some(model.child)
const writeArityChild = (
  model: ArityParent,
  child: ArityModel,
): ArityParent => ({ ...model, child })
const toArityParentMessage = (message: ArityMessage): ArityMessage => message

const WrappedArityOwner = owner('Binding/WrappedArity')
const WrappedArityDefinition = WrappedArityOwner.define({
  Model: ArityModel,
  Message: ArityMessage,
})
const wrappedArityUpdate = WrappedArityDefinition.defineUpdate(
  (
    ...[model, _message, context]: [
      model: ArityModel,
      message: ArityMessage,
      context: Readonly<{ amount: number }>,
    ]
  ) => ({
    model: modifyFields(model, {
      count: count => count + context.amount,
    }),
  }),
)
const defaultIncrement = WrappedArityDefinition.defineStep(
  (model: ArityModel, amount: number = 1) => ({
    model: modifyFields(model, { count: count => count + amount }),
  }),
)
const addMany = WrappedArityDefinition.defineStep(
  (model: ArityModel, ...amounts: ReadonlyArray<number>) => ({
    model: modifyFields(model, {
      count: count =>
        count + amounts.reduce((total, amount) => total + amount, 0),
    }),
  }),
)
const resetArity = WrappedArityDefinition.defineStep((model: ArityModel) => ({
  model: modifyFields(model, { count: () => 0 }),
}))
const WrappedArity = WrappedArityDefinition.compose({
  init: () => ({ model: ArityModel.make({ count: 0 }) }),
  update: wrappedArityUpdate,
  steps: { defaultIncrement, addMany, resetArity },
  EffectsLayer: Layer.empty,
})
const wrappedArity = WrappedArity.bind({
  placement: 'wrapped-arity',
  read: readArityChild,
  write: writeArityChild,
  toParentMessage: toArityParentMessage,
})

const embedViewlessDescriptorWithoutView = () =>
  // @ts-expect-error a viewless descriptor requires an explicit view
  wrappedArity.embed({
    slotId: 'viewless-arity',
    model: initialArityParent.child,
  })
void embedViewlessDescriptorWithoutView

const makeArityDescriptor = <
  const OwnerValue extends Owner<any>,
  const UpdateFunction extends (...args: ReadonlyArray<any>) => any,
>(
  ownerValue: OwnerValue,
  update: UpdateFunction,
) => ({
  owner: ownerValue,
  Model: ArityModel,
  Message: ArityMessage,
  mounts: [],
  children: [],
  init: (): Update.Return<ArityModel, ArityMessage> => ({
    model: ArityModel.make({ count: 0 }),
  }),
  update,
  steps: {},
  subscriptions: {},
  managedResources: {},
  EffectsLayer: Layer.empty,
  hostHandlers: [],
})

const IgnoredMessageOwner = owner('Binding/IgnoredMessage')
const IgnoredMessage = makeArityDescriptor(
  IgnoredMessageOwner,
  (model: ArityModel): Update.Return<ArityModel, ArityMessage> => ({
    model: modifyFields(model, { count: count => count + 1 }),
  }),
)
const ignoredMessage = bind(IgnoredMessage, {
  placement: 'ignored-message',
  read: readArityChild,
  write: writeArityChild,
  toParentMessage: toArityParentMessage,
})

const DefaultContextOwner = owner('Binding/DefaultContext')
const DefaultContext = makeArityDescriptor(
  DefaultContextOwner,
  (
    model: ArityModel,
    _message: ArityMessage,
    context: Readonly<{ amount: number }> = { amount: 2 },
  ): Update.Return<ArityModel, ArityMessage> => ({
    model: modifyFields(model, {
      count: count => count + context.amount,
    }),
  }),
)
const defaultContext = bind(DefaultContext, {
  placement: 'default-context',
  read: readArityChild,
  write: writeArityChild,
  toParentMessage: toArityParentMessage,
})

const OptionalContextOwner = owner('Binding/OptionalContext')
const OptionalContext = makeArityDescriptor(
  OptionalContextOwner,
  (
    model: ArityModel,
    _message: ArityMessage,
    context?: Readonly<{ amount: number }>,
  ): Update.Return<ArityModel, ArityMessage> => ({
    model: modifyFields(model, {
      count: count => count + (context?.amount ?? 1),
    }),
  }),
)
const optionalContext = bind(OptionalContext, {
  placement: 'optional-context',
  read: readArityChild,
  write: writeArityChild,
  toParentMessage: toArityParentMessage,
})

describe('Submodel binding', () => {
  it('preserves contextual update arguments in data-first and data-last folds', () => {
    const dataFirst = home.fold(
      initialParent,
      ChildMessage.ChangedCount({ amount: 3 }),
      { roomId: 'room' },
    )
    const dataLast = home.step(ChildMessage.ChangedCount({ amount: 3 }), {
      roomId: 'room',
    })(initialParent)

    expect(Option.getOrThrow(dataFirst.model.maybeChild).count).toBe(9)
    expect(dataLast).toEqual(dataFirst)

    expectTypeOf(dataFirst).toEqualTypeOf<
      Update.ReturnWithOutMessage<
        ParentModel,
        ParentMessage,
        ParentOutMessage,
        never
      >
    >()
  })

  it('returns the parent unchanged when an optional child is absent', () => {
    const parentWithoutChild: ParentModel = {
      ...initialParent,
      maybeChild: Option.none(),
    }
    const result = home.fold(
      parentWithoutChild,
      ChildMessage.ChangedCount({ amount: 3 }),
      { roomId: 'room' },
    )

    expect(result).toEqual({ model: parentWithoutChild })
  })

  it('lifts registered Steps and preserves their argument tuples', () => {
    const resetResult = home.steps.reset()(initialParent)
    const contextualResult = home.steps.addForRoom(3, { roomId: 'room' })(
      initialParent,
    )

    expect(Option.getOrThrow(resetResult.model.maybeChild).count).toBe(0)
    expect(Option.getOrThrow(contextualResult.model.maybeChild).count).toBe(9)
    expectTypeOf(home.steps.addForRoom).parameters.toEqualTypeOf<
      [amount: number, context: Readonly<{ roomId: string }>]
    >()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof home.steps.save>>
    >().toEqualTypeOf<Command.HandlerOf<typeof Save>>()
  })

  it('handles OutMessages locally and gives a derived result precedence over forwarding', () => {
    const result = home.fold(initialParent, ChildMessage.ReportedCount(), {
      roomId: 'room',
    })
    const stepResult = home.steps.report()(initialParent)

    expect(result.model.reports).toEqual([2])
    expect(result.outMessage).toEqual(
      ParentOutMessage.DerivedReport({ value: 2 }),
    )
    expect(stepResult.outMessage).toEqual(
      ParentOutMessage.DerivedReport({ value: 2 }),
    )
  })

  it('keeps Subscription gates separate from update placement', () => {
    const gatedParent: ParentModel = { ...initialParent, isListening: false }
    const dependencies =
      home.subscriptions.ticks.modelToDependencies(gatedParent)
    const updateResult = home.fold(
      gatedParent,
      ChildMessage.ChangedCount({ amount: 1 }),
      { roomId: 'x' },
    )

    expect(Option.isNone(dependencies.maybeDependencies)).toBe(true)
    expect(Option.getOrThrow(updateResult.model.maybeChild).count).toBe(4)
  })

  it('applies one Subscription gate across every child entry', () => {
    const gated = Child.bind({
      placement: 'gated-home',
      read: (model: ParentModel) => model.maybeChild,
      write: writeChild,
      toParentMessage,
      outMessage: { fold: foldChildOutMessage },
      subscriptions: {
        when: (model: ParentModel) => model.isListening,
      },
    })
    const dependencies = gated.subscriptions.ticks.modelToDependencies({
      ...initialParent,
      isListening: false,
    })

    expect(Option.isNone(dependencies.maybeDependencies)).toBe(true)
  })

  it('preserves FoldContext Command lifting and exact requirements', () => {
    const result = commandHome.fold(
      initialParent,
      ChildMessage.ReportedCount(),
      { roomId: 'room' },
    )

    expect(result.commands).toHaveLength(1)
    expectTypeOf<
      Update.RequirementsOf<typeof commandHome.fold>
    >().toEqualTypeOf<Command.HandlerOf<typeof Save>>()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof commandHome.step>>
    >().toEqualTypeOf<Command.HandlerOf<typeof Save>>()
  })

  it('keeps forward-only policy requirements separate from child producers', () => {
    const result = forwardOnlyHome.fold(
      initialParent,
      ChildMessage.ReportedCount(),
      { roomId: 'room' },
    )

    expect(result.outMessage).toEqual(
      ParentOutMessage.ForwardedReport({ value: 2 }),
    )
    expectTypeOf(result).toEqualTypeOf<
      Update.ReturnWithOutMessage<
        ParentModel,
        ParentMessage,
        ParentOutMessage,
        never
      >
    >()
    expectTypeOf<
      Update.RequirementsOf<typeof forwardOnlyHome.fold>
    >().toEqualTypeOf<never>()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof forwardOnlyHome.steps.save>>
    >().toEqualTypeOf<Command.HandlerOf<typeof Save>>()
  })

  it('applies policy Command types only to producers that can emit an OutMessage', () => {
    const reset = parentCommandHome.steps.reset()(initialParent)
    const report = parentCommandHome.steps.report()(initialParent)

    expect(reset.commands).toEqual([])
    expect(report.commands).toHaveLength(1)
    expectTypeOf(reset).toEqualTypeOf<
      Update.Return<ParentModel, ParentMessage>
    >()
    expectTypeOf(report).toEqualTypeOf<
      Update.ReturnWithOutMessage<
        ParentModel,
        ParentMessage | PolicyMessage,
        ParentOutMessage,
        Command.HandlerOf<typeof RunPolicyWork>
      >
    >()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof parentCommandHome.steps.reset>>
    >().toEqualTypeOf<never>()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof parentCommandHome.steps.report>>
    >().toEqualTypeOf<Command.HandlerOf<typeof RunPolicyWork>>()
  })

  it('keeps source handles readable and qualifies collected registrations', () => {
    const aggregated = aggregateChildren([home])
    const declarations = Subscription.__messageDeclarations(
      aggregated.subscriptions,
    )

    expect(home.subscriptions.ticks.name).toBe('Binding/Child/ObserveTicks')
    expect(home.managedResources.session.name).toBe(
      'Binding/Child/ManageSession',
    )
    expect(home.managedResources.session.resource).toBe(Session)
    expect(aggregated.subscriptions['home/ticks']).toBe(
      home.subscriptions.ticks,
    )
    expect(aggregated.managedResources['home/session']).toBe(
      home.managedResources.session,
    )
    expect(declarations).toHaveLength(1)
    expect(declarations[0]).toMatchObject({
      entry: home.subscriptions.ticks,
      entryKey: 'home/ticks',
    })
    expect(declarations[0]?.messageMappers).toHaveLength(1)
  })

  it('preserves lifecycle contracts from a named child array', () => {
    const pulseChild = ChildDefinition.compose({
      init: Child.init,
      update: Child.update,
      subscriptions: { pulses: childSubscriptions.ticks },
      EffectsLayer: Layer.empty,
      hostHandlers: [childSubscriptions.ticks, Measure],
    })
    const room = pulseChild.bind({
      placement: 'room',
      read: (model: ParentModel) => model.maybeChild,
      write: writeChild,
      toParentMessage,
      outMessage: { fold: foldChildOutMessage },
    })
    const children = [home, room]
    const ParentSchema = Schema.Struct({
      maybeChild: Schema.Option(ChildModel),
      reports: Schema.Array(Schema.Number),
      isListening: Schema.Boolean,
    })
    const parentContract = owner('Binding/NamedChildren').define({
      Model: ParentSchema,
      Message: ParentMessage,
      OutMessage: ParentOutMessage,
      children,
    })
    const parent = parentContract.compose({
      init: () => ({ model: initialParent }),
      update: (model: ParentModel, _message: ParentMessage) => ({ model }),
      EffectsLayer: Layer.empty,
      hostHandlers: [
        Save,
        childSubscriptions.ticks,
        childManagedResources.session,
        Measure,
      ],
    })

    const inline = aggregateChildren([home, room])

    expectTypeOf<keyof typeof parent.subscriptions>().toEqualTypeOf<
      'home/ticks' | 'room/pulses'
    >()
    expectTypeOf(parent.subscriptions).toExtend<typeof inline.subscriptions>()
    expectTypeOf(inline.subscriptions).toExtend<typeof parent.subscriptions>()
    expectTypeOf(parent.managedResources).toExtend<
      typeof inline.managedResources
    >()
    expectTypeOf(inline.managedResources).toExtend<
      typeof parent.managedResources
    >()
    expectTypeOf<
      ManagedResource.ServicesOf<typeof parent.managedResources>
    >().toEqualTypeOf<
      ManagedResource.ServicesOf<typeof inline.managedResources>
    >()
    expectTypeOf(parent.subscriptions['home/ticks']).toEqualTypeOf<
      typeof home.subscriptions.ticks
    >()
    expectTypeOf(parent.managedResources['home/session']).toEqualTypeOf<
      typeof home.managedResources.session
    >()
    expect(parent.subscriptions['home/ticks']).toBe(home.subscriptions.ticks)
    expect(parent.subscriptions['room/pulses']).toBe(room.subscriptions.pulses)
    expect(parent.managedResources['home/session']).toBe(
      home.managedResources.session,
    )
  })

  it('uses the canonical view across explicit slots and accepts a typed override', () => {
    const childModel = Option.getOrThrow(initialParent.maybeChild)
    const desktop = home.embed({
      slotId: 'desktop-home',
      model: childModel,
    })
    const mobile = home.embed({
      slotId: 'mobile-home',
      model: childModel,
    })
    const detailed = home.embed({
      slotId: 'detailed-home',
      model: childModel,
      view: detailedChildView,
      viewInputs: { prefix: 'Detailed count' },
    })

    expect(desktop.slotId).toBe('desktop-home')
    expect(mobile.slotId).toBe('mobile-home')
    expect(desktop.view).toBe(childView)
    expect(mobile.view).toBe(childView)
    expect(detailed.view).toBe(detailedChildView)
    expect(detailed.viewInputs).toEqual({ prefix: 'Detailed count' })
    expect(desktop.toParentMessage(ChildMessage.ObservedTick())).toEqual(
      toParentMessage(ChildMessage.ObservedTick()),
    )
    expectTypeOf(desktop).toEqualTypeOf<
      SubmodelConfig<typeof childView, ParentMessage>
    >()
    expectTypeOf(detailed).toEqualTypeOf<
      SubmodelConfig<typeof detailedChildView, ParentMessage>
    >()
  })
})

describe('Submodel binding arity', () => {
  it('executes and defers a rest tuple wrapped update without runtime arity checks', () => {
    const message = ArityMessage.IncreasedCount()
    const folded = wrappedArity.fold(initialArityParent, message, { amount: 2 })
    const deferred = wrappedArity.step(message, { amount: 3 })(
      initialArityParent,
    )

    expect(WrappedArity.update.length).toBe(0)
    expect(folded.model.child.count).toBe(2)
    expect(deferred.model.child.count).toBe(3)
    expectTypeOf(folded).toEqualTypeOf<
      Update.Return<ArityParent, ArityMessage>
    >()
  })

  it('supplies the declared Message when the update implementation ignores it', () => {
    const message = ArityMessage.IncreasedCount()
    const folded = ignoredMessage.fold(initialArityParent, message)
    const deferred = ignoredMessage.step(message)(initialArityParent)

    expect(IgnoredMessage.update.length).toBe(1)
    expect(folded.model.child.count).toBe(1)
    expect(deferred.model.child.count).toBe(1)
  })

  it('preserves default and optional update context in both forms', () => {
    const message = ArityMessage.IncreasedCount()
    const defaultFold = defaultContext.fold(initialArityParent, message)
    const defaultStep = defaultContext.step(message, { amount: 4 })(
      initialArityParent,
    )
    const optionalFold = optionalContext.fold(initialArityParent, message)
    const optionalStep = optionalContext.step(message, { amount: 5 })(
      initialArityParent,
    )

    expect(defaultFold.model.child.count).toBe(2)
    expect(defaultStep.model.child.count).toBe(4)
    expect(optionalFold.model.child.count).toBe(1)
    expect(optionalStep.model.child.count).toBe(5)
  })

  it('returns Steps uniformly for noarg, defaulted, and rest producers', () => {
    const defaultResult =
      wrappedArity.steps.defaultIncrement()(initialArityParent)
    const explicitDefaultResult =
      wrappedArity.steps.defaultIncrement(4)(initialArityParent)
    const restResult = wrappedArity.steps.addMany(2, 3)(initialArityParent)
    const resetResult = wrappedArity.steps.resetArity()({
      child: ArityModel.make({ count: 8 }),
    })

    expect(defaultIncrement.length).toBe(1)
    expect(addMany.length).toBe(1)
    expect(defaultResult.model.child.count).toBe(1)
    expect(explicitDefaultResult.model.child.count).toBe(4)
    expect(restResult.model.child.count).toBe(5)
    expect(resetResult.model.child.count).toBe(0)
    expectTypeOf(wrappedArity.steps.defaultIncrement).parameters.toEqualTypeOf<
      [amount?: number | undefined]
    >()
    expectTypeOf(wrappedArity.steps.addMany).parameters.toEqualTypeOf<
      [...amounts: Array<number>]
    >()
    expectTypeOf(wrappedArity.steps.resetArity).parameters.toEqualTypeOf<[]>()
  })
})

describe('Submodel child registration composition', () => {
  it('rejects two placements that own the same ManagedResource identity', () => {
    const sidebar = Child.bind({
      placement: 'sidebar',
      read: (model: ParentModel) => model.maybeChild,
      write: writeChild,
      toParentMessage,
      outMessage: { fold: foldChildOutMessage },
    })

    expect(() => aggregateChildren([home, sidebar])).toThrow(
      /bindings "home" and "sidebar" register the same ManagedResource tag key "Binding\/Child\/Session"/,
    )
  })

  it.effect(
    'shares repeated Mount definitions and descriptor Layer recipes',
    () =>
      Effect.gen(function* () {
        class BuildMarker extends Context.Service<BuildMarker, object>()(
          'BindingBuildMarker',
        ) {}

        let buildCount = 0
        const RepeatedOwner = owner('Binding/Repeated')
        const RepeatedMessage = defineMessageUnion({ CompletedMount: {} })
        type RepeatedMessage = typeof RepeatedMessage.Type
        const RepeatedMount = Mount.define(RepeatedOwner.name('Mount'), {
          messages: [RepeatedMessage.CompletedMount],
        })
        const RepeatedDefinition = RepeatedOwner.define({
          Model: ChildModel,
          Message: RepeatedMessage,
          mounts: [RepeatedMount],
        })
        const EffectsLayer = Layer.sync(BuildMarker, () => {
          buildCount += 1
          return {}
        })
        const Repeated = RepeatedDefinition.compose({
          init: () => ({ model: ChildModel.make({ count: 0 }) }),
          update: (model: ChildModel) => ({ model }),
          EffectsLayer,
          hostHandlers: [RepeatedMount],
        })
        type RepeatedParent = Readonly<{ child: ChildModel }>
        const toRepeatedParentMessage = (
          message: RepeatedMessage,
        ): RepeatedMessage => message
        const bindRepeated = (placement: 'first' | 'second') =>
          Repeated.bind({
            placement,
            read: (model: RepeatedParent) => Option.some(model.child),
            write: (model, child) => ({ ...model, child }),
            toParentMessage: toRepeatedParentMessage,
          })
        const aggregated = aggregateChildren([
          bindRepeated('first'),
          bindRepeated('second'),
        ])

        expect(aggregated.mounts).toEqual([RepeatedMount])

        yield* Effect.void.pipe(Effect.provide(aggregated.EffectsLayer))
        expect(buildCount).toBe(1)
      }),
  )
})

describe('generic descriptor refinement', () => {
  const GenericOwner = owner('Binding/Choice')
  const CompletedChoiceWork = Schema.TaggedStruct('CompletedChoiceWork', {})
  const FinishChoice = Command.define(GenericOwner.name('FinishChoice'), {
    messages: [CompletedChoiceWork],
  })

  const makeChoice = <Value extends string>(Value: Schema.Schema<Value>) => {
    const Model = Schema.Struct({ value: Value })
    type Model = typeof Model.Type
    const Message = Schema.Union([
      Schema.TaggedStruct('SelectedValue', { value: Value }),
      CompletedChoiceWork,
    ])
    type Message = typeof Message.Type
    const OutMessage = Schema.TaggedStruct('SelectedValue', { value: Value })
    type OutMessage = typeof OutMessage.Type
    const Definition = GenericOwner.define({ Model, Message, OutMessage })
    const update = Definition.defineUpdate((model: Model, message: Message) => {
      if (message._tag === 'SelectedValue') {
        return {
          model: Model.make({ value: message.value }),
          outMessage: OutMessage.make({ value: message.value }),
        }
      } else {
        return { model }
      }
    })
    const finish = Definition.defineStep((model: Model) => ({
      model,
      commands: [FinishChoice()],
    }))

    return Definition.compose({
      init: (value: Value) => ({ model: Model.make({ value }) }),
      update,
      steps: { finish },
      EffectsLayer: Layer.empty,
      hostHandlers: [FinishChoice],
    })
  }

  it('preserves a refined OutMessage payload and shared handler definition', () => {
    const Choice = makeChoice(Schema.Literals(['One', 'Two']))
    type ChoiceModel = typeof Choice.Model.Type
    type ChoiceMessage = typeof Choice.Message.Type
    type ChoiceOutMessage = typeof Choice.OutMessage.Type
    type ChoiceParent = Readonly<{ choice: ChoiceModel }>
    type DeclaredOutMessage =
      typeof Choice extends Readonly<{
        OutMessage: Readonly<{ Type: infer OutMessage }>
      }>
        ? OutMessage
        : never
    expectTypeOf<DeclaredOutMessage>().toEqualTypeOf<ChoiceOutMessage>()
    const directBinding = bind(Choice, {
      placement: 'direct-choice',
      read: (model: ChoiceParent) => Option.some(model.choice),
      write: (model, choice) => ({ ...model, choice }),
      toParentMessage: (message: ChoiceMessage) => message,
      outMessage: {
        fold: outMessage => model => ({ model, outMessage }),
      },
    })
    const binding = Choice.bind({
      placement: 'choice',
      read: (model: ChoiceParent) => Option.some(model.choice),
      write: (model, choice) => ({ ...model, choice }),
      toParentMessage: (message: ChoiceMessage) => message,
      outMessage: {
        fold: (outMessage: ChoiceOutMessage) => model => ({
          model,
          outMessage,
        }),
      },
    })

    const result = binding.fold(
      { choice: Choice.Model.make({ value: 'One' }) },
      { _tag: 'SelectedValue', value: 'Two' },
    )

    expect(result.outMessage).toEqual({ _tag: 'SelectedValue', value: 'Two' })
    expectTypeOf<
      ReturnType<typeof directBinding.fold>['outMessage']
    >().toEqualTypeOf<ChoiceOutMessage | undefined>()
    expectTypeOf(result.outMessage).toEqualTypeOf<
      ChoiceOutMessage | undefined
    >()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof binding.steps.finish>>
    >().toEqualTypeOf<Command.HandlerOf<typeof FinishChoice>>()

    const invalidChoiceMessage: ChoiceMessage = {
      _tag: 'SelectedValue',
      // @ts-expect-error the concrete descriptor accepts only refined values
      value: 'Three',
    }
    void invalidChoiceMessage
  })
})
