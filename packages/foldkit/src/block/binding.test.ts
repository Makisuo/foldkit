import { Context, Effect, Layer, Option, Schema } from 'effect'
import { expect, expectTypeOf } from 'vitest'

import { describe, it } from '@effect/vitest'

import * as Command from '../command/index.js'
import type { BoundBlockConfig, BoundBlockView } from '../html/block.js'
import * as ManagedResource from '../managedResource/index.js'
import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import * as Subscription from '../subscription/subscription.js'
import * as Update from '../update/index.js'
import type { BindingRequirement } from './binding.js'
import { aggregateChildren, bind, inspectBinding } from './binding.js'
import { define } from './define.js'
import { LocalMountsTypeId } from './definition.js'
import type { Owner } from './owner.js'
import type { Qualify, Scoped } from './scope.js'

const ChildOwner = define('BindingChild')

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

const Save = ChildOwner.command('Save', {
  messages: [ChildMessage.CompletedSave],
})

const ChildChannels = ChildOwner.define({
  Model: ChildModel,
  Message: ChildMessage,
  OutMessage: ChildOutMessage,
})

const childSubscriptions = ChildChannels.subscriptions(entry => ({
  ticks: entry(
    'ObserveTicks',
    { count: Schema.Number },
    {
      messages: [ChildMessage.ObservedTick],
      modelToDependencies: model => ({ count: model.count }),
    },
  ),
}))

const Session = ChildOwner.resource<string>()('Session')

const childManagedResources = ChildChannels.managedResources(entry => ({
  session: entry('ManageSession', Schema.Option(Schema.String), {
    resource: Session,
    modelToMaybeRequirements: model =>
      model.count === 0 ? Option.none() : Option.some(`${model.count}`),
    onAcquired: value => ChildMessage.AcquiredSession({ value }),
    onReleased: ChildMessage.ReleasedSession,
    onAcquireError: () => ChildMessage.FailedAcquireSession(),
  }),
}))

const Measure = ChildOwner.mount('Measure', {
  messages: [ChildMessage.CompletedMeasure],
})

const childBase = ChildOwner.define({
  Model: ChildModel,
  Message: ChildMessage,
  OutMessage: ChildOutMessage,
})
const ChildComposition = childBase.toComposition({ mounts: [Measure] })

const childView = ChildComposition.view((model, h) =>
  h.div([], [`Count ${model.count}`]),
)

const detailedChildView = ChildComposition.view.withInputs<
  Readonly<{ prefix: string }>
>((model, viewInputs, h) => h.div([], [`${viewInputs.prefix} ${model.count}`]))

const childUpdate = childBase.update(
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

const save = childBase.step((model: ChildModel) => ({
  model,
  commands: [Save()],
}))

const reset = childBase.step((model: ChildModel) => ({
  model: modifyFields(model, { count: () => 0 }),
}))

const addForRoom = childBase.step(
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

const report = childBase.step((model: ChildModel) => ({
  model,
  outMessage: ChildOutMessage.Reported({ value: model.count }),
}))

const Child = ChildComposition.toBlock({
  view: childView,
  init: (count: number) => ({ model: ChildModel.make({ count }) }),
  update: childUpdate,
  expose: { save, reset, addForRoom, report },
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

const ParentModel = Schema.Struct({
  maybeChild: Schema.Option(ChildModel),
  reports: Schema.Array(Schema.Number),
  isListening: Schema.Boolean,
})
type ParentModel = typeof ParentModel.Type

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

const Parent = define('BindingParent', {
  Model: ParentModel,
  Message: ParentMessage,
  OutMessage: ParentOutMessage,
})

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

const home = Parent.bindChild(Child, {
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
const homeInspection = inspectBinding(home)

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

const commandHome = Parent.bindChild(Child, {
  placement: 'command-home',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage,
  outMessage: { fold: foldChildOutMessageWithCommand },
})

const PolicyMessage = defineMessageUnion({ CompletedPolicyWork: {} })
type PolicyMessage = typeof PolicyMessage.Type

const ParentPolicyOwner = define('BindingParentPolicy')
const RunPolicyWork = ParentPolicyOwner.command('RunPolicyWork', {
  messages: [PolicyMessage.CompletedPolicyWork],
})
const ParentPolicy = ParentPolicyOwner.define({
  Model: ParentModel,
  Message: PolicyMessage,
  OutMessage: ParentOutMessage,
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

const parentCommandHome = ParentPolicy.bindChild(Child, {
  placement: 'parent-command-home',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage: () => PolicyMessage.CompletedPolicyWork(),
  outMessage: { fold: foldChildOutMessageWithParentCommand },
})

const forwardOnlyHome = Parent.bindChild(Child, {
  placement: 'forward-only-home',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage,
  outMessage: { forward: forwardChildOutMessage },
})

const bindWithoutOutMessagePolicy = () =>
  // @ts-expect-error an OutMessage block requires an explicit parent policy
  Parent.bindChild(Child, {
    placement: 'missing-policy',
    read: (model: ParentModel) => model.maybeChild,
    write: writeChild,
    toParentMessage,
  })
void bindWithoutOutMessagePolicy

const bindWithUnknownForward = () =>
  // @ts-expect-error an unknown return would erase the parent OutMessage contract
  Parent.bindChild(Child, {
    placement: 'unknown-forward',
    read: (model: ParentModel) => model.maybeChild,
    write: writeChild,
    toParentMessage,
    // eslint-disable-next-line foldkit/no-empty-to-parent-out-message
    outMessage: { forward: (): unknown => undefined },
  })
void bindWithUnknownForward

const locallyHandledWithoutForwarding = Parent.bindChild(Child, {
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

const ArityParent = Schema.Struct({ child: ArityModel })
type ArityParent = typeof ArityParent.Type

const initialArityParent: ArityParent = {
  child: ArityModel.make({ count: 0 }),
}

const readArityChild = (model: ArityParent) => Option.some(model.child)
const writeArityChild = (
  model: ArityParent,
  child: ArityModel,
): ArityParent => ({ ...model, child })
const toArityParentMessage = (message: ArityMessage): ArityMessage => message

const WrappedArityOwner = define('BindingWrappedArity')
const WrappedArity = WrappedArityOwner.define({
  Model: ArityModel,
  Message: ArityMessage,
})
const wrappedArityUpdate = WrappedArity.update(
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
const defaultIncrement = WrappedArity.step(
  (model: ArityModel, amount: number = 1) => ({
    model: modifyFields(model, { count: count => count + amount }),
  }),
)
const addMany = WrappedArity.step(
  (model: ArityModel, ...amounts: ReadonlyArray<number>) => ({
    model: modifyFields(model, {
      count: count =>
        count + amounts.reduce((total, amount) => total + amount, 0),
    }),
  }),
)
const resetArity = WrappedArity.step((model: ArityModel) => ({
  model: modifyFields(model, { count: () => 0 }),
}))
const WrappedArityBlock = WrappedArity.toComposition().toBlock({
  init: () => ({ model: ArityModel.make({ count: 0 }) }),
  update: wrappedArityUpdate,
  expose: { defaultIncrement, addMany, resetArity },
  EffectsLayer: Layer.empty,
})
const WrappedArityParent = define('BindingWrappedArityParent', {
  Model: ArityParent,
  Message: ArityMessage,
})
const wrappedArity = WrappedArityParent.bindChild(WrappedArityBlock, {
  placement: 'wrapped-arity',
  read: readArityChild,
  write: writeArityChild,
  toParentMessage: toArityParentMessage,
})

const embedViewlessBlockWithoutView = () =>
  // @ts-expect-error a viewless block requires an explicit view
  wrappedArity.embedView({
    slotId: 'viewless-arity',
    model: initialArityParent.child,
  })
void embedViewlessBlockWithoutView

const makeArityBlock = <
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
  [LocalMountsTypeId]: [],
  children: [],
  init: (): Update.Return<ArityModel, ArityMessage> => ({
    model: ArityModel.make({ count: 0 }),
  }),
  update,
  expose: {},
  subscriptions: {},
  managedResources: {},
  EffectsLayer: Layer.empty,
  hostHandlers: [],
})

const IgnoredMessageOwner = define('BindingIgnoredMessage')
const IgnoredMessage = makeArityBlock(
  IgnoredMessageOwner.define({ Model: ArityModel, Message: ArityMessage })
    .owner,
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

const DefaultContextOwner = define('BindingDefaultContext')
const DefaultContext = makeArityBlock(
  DefaultContextOwner.define({ Model: ArityModel, Message: ArityMessage })
    .owner,
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

const OptionalContextOwner = define('BindingOptionalContext')
const OptionalContext = makeArityBlock(
  OptionalContextOwner.define({ Model: ArityModel, Message: ArityMessage })
    .owner,
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

describe('Block binding', () => {
  it('preserves contextual update arguments without a deferred update member', () => {
    const result = home.fold(
      initialParent,
      ChildMessage.ChangedCount({ amount: 3 }),
      { roomId: 'room' },
    )

    expect(Option.getOrThrow(result.model.maybeChild).count).toBe(9)
    expect(home).not.toHaveProperty('step')
    expectTypeOf<
      'step' extends keyof typeof home ? true : false
    >().toEqualTypeOf<false>()

    expectTypeOf(result).toEqualTypeOf<
      Update.WithRegistrationEvidence<
        Update.ReturnWithOutMessage<
          ParentModel,
          ParentMessage,
          ParentOutMessage,
          never
        >,
        BindingRequirement<'home', typeof Child>
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

  it('projects exposed operations directly and preserves their argument tuples', () => {
    const resetResult = home.reset()(initialParent)
    const contextualResult = home.addForRoom(3, { roomId: 'room' })(
      initialParent,
    )

    expect(Option.getOrThrow(resetResult.model.maybeChild).count).toBe(0)
    expect(Option.getOrThrow(contextualResult.model.maybeChild).count).toBe(9)
    expectTypeOf(home.addForRoom).parameters.toEqualTypeOf<
      [amount: number, context: Readonly<{ roomId: string }>]
    >()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof home.save>>
    >().toEqualTypeOf<Qualify<'home', Command.HandlerOf<typeof Save>>>()
  })

  it('handles OutMessages locally and gives a derived result precedence over forwarding', () => {
    const result = home.fold(initialParent, ChildMessage.ReportedCount(), {
      roomId: 'room',
    })
    const stepResult = home.report()(initialParent)

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
      inspectBinding(home).subscriptions.ticks.modelToDependencies(gatedParent)
    const updateResult = home.fold(
      gatedParent,
      ChildMessage.ChangedCount({ amount: 1 }),
      { roomId: 'x' },
    )

    expect(Option.isNone(dependencies.maybeDependencies)).toBe(true)
    expect(Option.getOrThrow(updateResult.model.maybeChild).count).toBe(4)
  })

  it('applies one Subscription gate across every child entry', () => {
    const gated = Parent.bindChild(Child, {
      placement: 'gated-home',
      read: (model: ParentModel) => model.maybeChild,
      write: writeChild,
      toParentMessage,
      outMessage: { fold: foldChildOutMessage },
      subscriptions: {
        when: (model: ParentModel) => model.isListening,
      },
    })
    const dependencies = inspectBinding(
      gated,
    ).subscriptions.ticks.modelToDependencies({
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
    >().toEqualTypeOf<Qualify<'command-home', Command.HandlerOf<typeof Save>>>()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof commandHome.report>>
    >().toEqualTypeOf<Qualify<'command-home', Command.HandlerOf<typeof Save>>>()
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
      Update.WithRegistrationEvidence<
        Update.ReturnWithOutMessage<
          ParentModel,
          ParentMessage,
          ParentOutMessage,
          never
        >,
        BindingRequirement<'forward-only-home', typeof Child>
      >
    >()
    expectTypeOf<
      Update.RequirementsOf<typeof forwardOnlyHome.fold>
    >().toEqualTypeOf<never>()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof forwardOnlyHome.save>>
    >().toEqualTypeOf<
      Qualify<'forward-only-home', Command.HandlerOf<typeof Save>>
    >()
  })

  it('applies policy Command types only to producers that can emit an OutMessage', () => {
    const reset = parentCommandHome.reset()(initialParent)
    const report = parentCommandHome.report()(initialParent)

    expect(reset.commands).toEqual([])
    expect(report.commands).toHaveLength(1)
    expectTypeOf(reset).toEqualTypeOf<
      Update.WithRegistrationEvidence<
        Update.Return<ParentModel, PolicyMessage>,
        BindingRequirement<'parent-command-home', typeof Child>
      >
    >()
    expectTypeOf(report).toEqualTypeOf<
      Update.WithRegistrationEvidence<
        Update.ReturnWithOutMessage<
          ParentModel,
          PolicyMessage,
          ParentOutMessage,
          Command.HandlerOf<typeof RunPolicyWork>
        >,
        BindingRequirement<'parent-command-home', typeof Child>
      >
    >()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof parentCommandHome.reset>>
    >().toEqualTypeOf<never>()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof parentCommandHome.report>>
    >().toEqualTypeOf<Command.HandlerOf<typeof RunPolicyWork>>()
  })

  it('keeps source handles readable and qualifies collected registrations', () => {
    const aggregated = aggregateChildren([home])
    const declarations = Subscription.__messageDeclarations(
      aggregated.subscriptions,
    )

    expect(childSubscriptions.ticks.name).toBe('BindingChild/ObserveTicks')
    expect(inspectBinding(home).subscriptions.ticks.name).toBe(
      'home/ObserveTicks',
    )
    expect(inspectBinding(home).managedResources.session.name).toBe(
      'home/ManageSession',
    )
    expect(
      inspectBinding(home).managedResources.session.resource._tag.key,
    ).not.toBe(Session._tag.key)
    expect(aggregated.subscriptions['home/ticks']).toBe(
      inspectBinding(home).subscriptions.ticks,
    )
    expect(aggregated.managedResources['home/session']).toBe(
      inspectBinding(home).managedResources.session,
    )
    expect(declarations).toHaveLength(1)
    expect(declarations[0]).toMatchObject({
      entry: inspectBinding(home).subscriptions.ticks,
      entryKey: 'home/ticks',
    })
    expect(declarations[0]?.messageMappers).toHaveLength(1)
  })

  it('preserves lifecycle contracts from a named child array', () => {
    const pulseChild = ChildComposition.toBlock({
      init: Child.init,
      update: Child.update,
      subscriptions: { pulses: childSubscriptions.ticks },
      EffectsLayer: Layer.empty,
      hostHandlers: [childSubscriptions.ticks, Measure],
    })
    const ParentSchema = Schema.Struct({
      maybeChild: Schema.Option(ChildModel),
      reports: Schema.Array(Schema.Number),
      isListening: Schema.Boolean,
    })
    const parentBase = define('BindingNamedChildren').define({
      Model: ParentSchema,
      Message: ParentMessage,
      OutMessage: ParentOutMessage,
    })
    const namedHome = parentBase.bindChild(Child, {
      placement: 'home',
      read: (model: ParentModel) => model.maybeChild,
      write: writeChild,
      toParentMessage,
      outMessage: { fold: foldChildOutMessage },
    })
    const room = parentBase.bindChild(pulseChild, {
      placement: 'room',
      read: (model: ParentModel) => model.maybeChild,
      write: writeChild,
      toParentMessage,
      outMessage: { fold: foldChildOutMessage },
    })
    const children = [namedHome, room]
    const parentContract = parentBase.toComposition({
      children,
    })
    const parent = parentContract.toBlock({
      init: () => ({ model: initialParent }),
      update: (model: ParentModel, _message: ParentMessage) => ({ model }),
      EffectsLayer: Layer.empty,
    })

    const inline = aggregateChildren([namedHome, room])

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
      typeof homeInspection.subscriptions.ticks
    >()
    expectTypeOf(parent.managedResources['home/session']).toEqualTypeOf<
      typeof homeInspection.managedResources.session
    >()
    expect(parent.subscriptions['home/ticks']).toBe(
      inspectBinding(namedHome).subscriptions.ticks,
    )
    expect(parent.subscriptions['room/pulses']).toBe(
      inspectBinding(room).subscriptions.pulses,
    )
    expect(parent.managedResources['home/session']).toBe(
      inspectBinding(namedHome).managedResources.session,
    )
  })

  it('uses the canonical view across explicit slots and accepts a typed override', () => {
    const childModel = Option.getOrThrow(initialParent.maybeChild)
    const desktop = home.embedView({
      slotId: 'desktop-home',
      model: childModel,
    })
    const mobile = home.embedView({
      slotId: 'mobile-home',
      model: childModel,
    })
    const detailed = home.embedView({
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
      BoundBlockConfig<
        BoundBlockView<
          typeof childView,
          BindingRequirement<'home', typeof Child>
        >,
        ParentMessage
      >
    >()
    expectTypeOf(detailed).toEqualTypeOf<
      BoundBlockConfig<
        BoundBlockView<
          typeof detailedChildView,
          BindingRequirement<'home', typeof Child>
        >,
        ParentMessage
      >
    >()
    expectTypeOf<
      keyof BindingRequirement<
        'home',
        typeof Child
      >['__blockBindingRequirement']['block']
    >().toEqualTypeOf<'owner' | 'mountRequirements'>()
  })
})

describe('Block binding arity', () => {
  it('executes a rest tuple wrapped update without runtime arity checks', () => {
    const message = ArityMessage.IncreasedCount()
    const folded = wrappedArity.fold(initialArityParent, message, { amount: 2 })

    expect(WrappedArityBlock.update.length).toBe(0)
    expect(folded.model.child.count).toBe(2)
    expectTypeOf(folded).toEqualTypeOf<
      Update.WithRegistrationEvidence<
        Update.Return<ArityParent, ArityMessage>,
        BindingRequirement<'wrapped-arity', typeof WrappedArityBlock>
      >
    >()
  })

  it('supplies the declared Message when the update implementation ignores it', () => {
    const message = ArityMessage.IncreasedCount()
    const folded = ignoredMessage.fold(initialArityParent, message)

    expect(IgnoredMessage.update.length).toBe(1)
    expect(folded.model.child.count).toBe(1)
  })

  it('preserves default and optional update context', () => {
    const message = ArityMessage.IncreasedCount()
    const defaultFold = defaultContext.fold(initialArityParent, message)
    const optionalFold = optionalContext.fold(initialArityParent, message)

    expect(defaultFold.model.child.count).toBe(2)
    expect(optionalFold.model.child.count).toBe(1)
  })

  it('returns Steps uniformly for noarg, defaulted, and rest producers', () => {
    const defaultResult = wrappedArity.defaultIncrement()(initialArityParent)
    const explicitDefaultResult =
      wrappedArity.defaultIncrement(4)(initialArityParent)
    const restResult = wrappedArity.addMany(2, 3)(initialArityParent)
    const resetResult = wrappedArity.resetArity()({
      child: ArityModel.make({ count: 8 }),
    })

    expect(defaultIncrement.length).toBe(1)
    expect(addMany.length).toBe(1)
    expect(defaultResult.model.child.count).toBe(1)
    expect(explicitDefaultResult.model.child.count).toBe(4)
    expect(restResult.model.child.count).toBe(5)
    expect(resetResult.model.child.count).toBe(0)
    expectTypeOf(wrappedArity.defaultIncrement).parameters.toEqualTypeOf<
      [amount?: number | undefined]
    >()
    expectTypeOf(wrappedArity.addMany).parameters.toEqualTypeOf<
      [...amounts: Array<number>]
    >()
    expectTypeOf(wrappedArity.resetArity).parameters.toEqualTypeOf<[]>()
  })
})

describe('Block child registration composition', () => {
  it('gives repeated ManagedResources independent placement capability keys', () => {
    const sidebar = Parent.bindChild(Child, {
      placement: 'sidebar',
      read: (model: ParentModel) => model.maybeChild,
      write: writeChild,
      toParentMessage,
      outMessage: { fold: foldChildOutMessage },
    })

    const aggregated = aggregateChildren([home, sidebar])
    expect(Object.keys(aggregated.managedResources)).toEqual([
      'home/session',
      'sidebar/session',
    ])
    expect(
      inspectBinding(home).managedResources.session.resource._tag.key,
    ).not.toBe(
      inspectBinding(sidebar).managedResources.session.resource._tag.key,
    )
  })

  it.effect('shares repeated Mount definitions and block Layer recipes', () =>
    Effect.gen(function* () {
      class BuildMarker extends Context.Service<BuildMarker, object>()(
        'BindingBuildMarker',
      ) {}

      let buildCount = 0
      const RepeatedOwner = define('BindingRepeated')
      const RepeatedMessage = defineMessageUnion({ CompletedMount: {} })
      type RepeatedMessage = typeof RepeatedMessage.Type
      const RepeatedMount = RepeatedOwner.mount('Mount', {
        messages: [RepeatedMessage.CompletedMount],
      })
      const repeatedBase = RepeatedOwner.define({
        Model: ChildModel,
        Message: RepeatedMessage,
      })
      const RepeatedComposition = repeatedBase.toComposition({
        mounts: [RepeatedMount],
      })
      const EffectsLayer = Layer.sync(BuildMarker, () => {
        buildCount += 1
        return {}
      })
      const Repeated = RepeatedComposition.toBlock({
        init: () => ({ model: ChildModel.make({ count: 0 }) }),
        update: (model: ChildModel) => ({ model }),
        EffectsLayer,
        hostHandlers: [RepeatedMount],
      })
      const RepeatedParentModel = Schema.Struct({ child: ChildModel })
      type RepeatedParentModel = typeof RepeatedParentModel.Type
      const toRepeatedParentMessage = (
        message: RepeatedMessage,
      ): RepeatedMessage => message
      const RepeatedParent = define('BindingRepeatedParent', {
        Model: RepeatedParentModel,
        Message: RepeatedMessage,
      })
      const bindRepeated = (placement: 'first' | 'second') =>
        RepeatedParent.bindChild(Repeated, {
          placement,
          read: (model: RepeatedParentModel) => Option.some(model.child),
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

describe('generic block refinement', () => {
  const GenericOwner = define('BindingChoice')
  const CompletedChoiceWork = Schema.TaggedStruct('CompletedChoiceWork', {})
  const FinishChoice = GenericOwner.command('FinishChoice', {
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
    const update = Definition.update((model, message) => {
      if (message._tag === 'SelectedValue') {
        return {
          model: Model.make({ value: message.value }),
          outMessage: OutMessage.make({ value: message.value }),
        }
      } else {
        return { model }
      }
    })
    const finish = Definition.step((model: Model) => ({
      model,
      commands: [FinishChoice()],
    }))

    return Definition.toComposition().toBlock({
      init: (value: Value) => ({ model: Model.make({ value }) }),
      update,
      expose: { finish },
      EffectsLayer: Layer.empty,
      hostHandlers: [FinishChoice],
    })
  }

  it('preserves a refined OutMessage payload and shared handler definition', () => {
    const Choice = makeChoice(Schema.Literals(['One', 'Two']))
    type ChoiceModel = typeof Choice.Model.Type
    type ChoiceMessage = typeof Choice.Message.Type
    type ChoiceOutMessage = typeof Choice.OutMessage.Type
    const ChoiceParentModel = Schema.Struct({ choice: Choice.Model })
    type ChoiceParentModel = typeof ChoiceParentModel.Type
    type DeclaredOutMessage =
      typeof Choice extends Readonly<{
        OutMessage: Readonly<{ Type: infer OutMessage }>
      }>
        ? OutMessage
        : never
    expectTypeOf<DeclaredOutMessage>().toEqualTypeOf<ChoiceOutMessage>()
    const directBinding = bind(Choice, {
      placement: 'direct-choice',
      read: (model: ChoiceParentModel) => Option.some(model.choice),
      write: (model, choice) => ({ ...model, choice }),
      toParentMessage: (message: ChoiceMessage) => message,
      outMessage: {
        fold: outMessage => model => ({ model, outMessage }),
      },
    })
    const ChoiceParent = define('BindingChoiceParent', {
      Model: ChoiceParentModel,
      Message: Choice.Message,
      OutMessage: Choice.OutMessage,
    })
    const binding = ChoiceParent.bindChild(Choice, {
      placement: 'choice',
      read: (model: ChoiceParentModel) => Option.some(model.choice),
      write: (model: ChoiceParentModel, choice: ChoiceModel) => ({
        ...model,
        choice,
      }),
      toParentMessage: (message: ChoiceMessage) => message,
      outMessage: {
        fold: (outMessage: ChoiceOutMessage) => (model: ChoiceParentModel) => ({
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
      Update.RequirementsOf<ReturnType<typeof binding.finish>>
    >().toEqualTypeOf<
      Scoped<'choice', Command.HandlerOf<typeof FinishChoice>>
    >()

    const invalidChoiceMessage: ChoiceMessage = {
      _tag: 'SelectedValue',
      // @ts-expect-error the concrete block accepts only refined values
      value: 'Three',
    }
    void invalidChoiceMessage
  })
})
