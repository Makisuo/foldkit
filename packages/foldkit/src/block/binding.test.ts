import { Context, Effect, Layer, Option, Schema, Tuple } from 'effect'
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
import { aggregateChildren, inspectBinding } from './binding.js'
import type { DeferredBindingPolicy } from './deferredPolicy.js'
import { define } from './define.js'
import { LocalMountsTypeId } from './definition.js'
import type { Owner } from './owner.js'
import type { Qualify, Scoped } from './scope.js'

type CommandMessageOfReturn<Value> =
  Value extends Readonly<{
    commands?: Update.Commands<infer Message, any> | undefined
  }>
    ? Message
    : never

const ChildOwner = define('BindingChild')

const ChildModel = Schema.Struct({ count: Schema.Number })
type ChildModel = typeof ChildModel.Type

const ChildMessage = defineMessageUnion({
  RequestedSave: {},
  RequestedReset: {},
  RequestedAddForRoom: { amount: Schema.Number },
  RequestedReport: {},
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

const ChildChannelsDefinition = ChildOwner.define({
  Model: ChildModel,
  Message: ChildMessage,
  OutMessage: ChildOutMessage,
})

const childSubscriptions = ChildChannelsDefinition.subscriptions(entry => ({
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

const childManagedResources = ChildChannelsDefinition.managedResources(
  entry => ({
    session: entry('ManageSession', Schema.Option(Schema.String), {
      resource: Session,
      modelToMaybeRequirements: model =>
        model.count === 0 ? Option.none() : Option.some(`${model.count}`),
      onAcquired: value => ChildMessage.AcquiredSession({ value }),
      onReleased: ChildMessage.ReleasedSession,
      onAcquireError: () => ChildMessage.FailedAcquireSession(),
    }),
  }),
)

const Measure = ChildOwner.mount('Measure', {
  messages: [ChildMessage.CompletedMeasure],
})

const ChildBaseDefinition = ChildOwner.define({
  Model: ChildModel,
  Message: ChildMessage,
  OutMessage: ChildOutMessage,
})
const ChildComposition = ChildBaseDefinition.makeComposition({
  mounts: [Measure],
})

const childView = ChildComposition.makeView((model, h) =>
  h.div([], [`Count ${model.count}`]),
)

const detailedChildView = ChildComposition.makeView.withInputs<
  Readonly<{ prefix: string }>
>((model, viewInputs, h) => h.div([], [`${viewInputs.prefix} ${model.count}`]))

const save = ChildBaseDefinition.step(model => ({
  model,
  commands: [Save()],
}))

const reset = ChildBaseDefinition.step(model => ({
  model: modifyFields(model, { count: () => 0 }),
}))

const addForRoom = ChildBaseDefinition.step(
  (model, amount: number, context: Readonly<{ roomId: string }>) => ({
    model: modifyFields(model, {
      count: () => model.count + amount + context.roomId.length,
    }),
  }),
)

const report = ChildBaseDefinition.step(model => ({
  model,
  outMessage: ChildOutMessage.Reported({ value: model.count }),
}))

const childUpdate = ChildComposition.makeUpdate(
  (model, message, context: Readonly<{ roomId: string }>) =>
    ChildMessage.match(message, {
      RequestedSave: () => save(model),
      RequestedReset: () => reset(model),
      RequestedAddForRoom: ({ amount }) => addForRoom(model, amount, context),
      RequestedReport: () => report(model),
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

const Child = ChildComposition.makeBlock({
  view: childView,
  init: (count: number) => ({ model: ChildModel.make({ count }) }),
  update: childUpdate,
  operations: {
    save: () => Tuple.make(ChildMessage.RequestedSave(), { roomId: '' }),
    reset: () => Tuple.make(ChildMessage.RequestedReset(), { roomId: '' }),
    addForRoom: (amount: number, context: Readonly<{ roomId: string }>) =>
      Tuple.make(ChildMessage.RequestedAddForRoom({ amount }), context),
    report: () => Tuple.make(ChildMessage.RequestedReport(), { roomId: '' }),
  },
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
  GotChildMessage: { message: ChildMessage, roomId: Schema.String },
  RecordedReport: {},
  RequestedResetHome: {},
  RequestedAddHomeForRoom: { amount: Schema.Number, roomId: Schema.String },
  RequestedReportHome: {},
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
  ParentMessage.GotChildMessage({ message, roomId: 'room' })

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

const HomeBinding = Parent.bindChild(Child, {
  placement: 'home',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage,
  fromParentMessage: {
    parentMessage: ParentMessage.GotChildMessage,
    args: (_model, { message, roomId }) => Option.some([message, { roomId }]),
  },
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

const CommandHomeBinding = Parent.bindChild(Child, {
  placement: 'command-home',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage,
  fromParentMessage: {
    parentMessage: ParentMessage.GotChildMessage,
    args: (_model, { message, roomId }) => Option.some([message, { roomId }]),
  },
  outMessage: { fold: foldChildOutMessageWithCommand },
})

const PolicyMessage = defineMessageUnion({
  GotChildMessage: { message: ChildMessage, roomId: Schema.String },
  CompletedPolicyWork: {},
  RequestedResetHome: {},
  RequestedReportHome: {},
})
type PolicyMessage = typeof PolicyMessage.Type

const ParentPolicyOwner = define('BindingParentPolicy')
const RunPolicyWork = ParentPolicyOwner.command('RunPolicyWork', {
  messages: [PolicyMessage.CompletedPolicyWork],
})
const ParentPolicyDefinition = ParentPolicyOwner.define({
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

const ParentCommandHomeBinding = ParentPolicyDefinition.bindChild(Child, {
  placement: 'parent-command-home',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage: message =>
    PolicyMessage.GotChildMessage({ message, roomId: 'room' }),
  fromParentMessage: {
    parentMessage: PolicyMessage.GotChildMessage,
    args: (_model, { message, roomId }) => Option.some([message, { roomId }]),
  },
  outMessage: { fold: foldChildOutMessageWithParentCommand },
})

const ForwardOnlyHomeBinding = Parent.bindChild(Child, {
  placement: 'forward-only-home',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage,
  fromParentMessage: {
    parentMessage: ParentMessage.GotChildMessage,
    args: (_model, { message, roomId }) => Option.some([message, { roomId }]),
  },
  outMessage: { forward: forwardChildOutMessage },
})

const bindWithoutOutMessagePolicy = () =>
  Parent.bindChild(Child, {
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    placement: 'missing-policy',
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    read: (model: ParentModel) => model.maybeChild,
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    write: writeChild,
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    parentMessage: ParentMessage.GotChildMessage,
  })
void bindWithoutOutMessagePolicy

const bindWithUnknownForward = () =>
  Parent.bindChild(Child, {
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    placement: 'unknown-forward',
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    read: (model: ParentModel) => model.maybeChild,
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    write: writeChild,
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    parentMessage: ParentMessage.GotChildMessage,
    // eslint-disable-next-line foldkit/no-empty-to-parent-out-message
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    outMessage: { forward: (): unknown => undefined },
  })
void bindWithUnknownForward

const LocallyHandledWithoutForwardingBinding = Parent.bindChild(Child, {
  placement: 'locally-handled',
  read: (model: ParentModel) => model.maybeChild,
  write: writeChild,
  toParentMessage,
  fromParentMessage: {
    parentMessage: ParentMessage.GotChildMessage,
    args: (_model, { message, roomId }) => Option.some([message, { roomId }]),
  },
  outMessage: { fold: foldChildOutMessage },
})
void LocallyHandledWithoutForwardingBinding

const initialParent: ParentModel = {
  maybeChild: Option.some(ChildModel.make({ count: 2 })),
  reports: [],
  isListening: true,
}

const ParentComposition = Parent.makeComposition({
  childBindings: [HomeBinding],
})
const foldHome = ParentComposition.makeUpdate(model => ({ model }))
const foldCommandHome = Parent.makeComposition({
  childBindings: [CommandHomeBinding],
}).makeUpdate(model => ({ model }))
const foldForwardOnlyHome = Parent.makeComposition({
  childBindings: [ForwardOnlyHomeBinding],
}).makeUpdate(model => ({ model }))
const resetHome = Parent.step(_model => HomeBinding.reset())
const addHomeForRoom = Parent.step(
  (_model, amount: number, context: Readonly<{ roomId: string }>) =>
    HomeBinding.addForRoom(amount, context),
)
const reportHome = Parent.step(_model => HomeBinding.report())
const ParentRuntime = ParentComposition.makeBlock({
  init: () => ({ model: initialParent }),
  update: ParentComposition.makeUpdate((model, message) =>
    ParentMessage.match(message, {
      RequestedResetHome: () => resetHome(model),
      RequestedAddHomeForRoom: ({ amount, roomId }) =>
        addHomeForRoom(model, amount, { roomId }),
      RequestedReportHome: () => reportHome(model),
      RecordedReport: () => ({ model }),
    }),
  ),
  operations: {
    resetHome: () => Tuple.make(ParentMessage.RequestedResetHome()),
    addHomeForRoom: (amount: number, context: Readonly<{ roomId: string }>) =>
      Tuple.make(
        ParentMessage.RequestedAddHomeForRoom({
          amount,
          roomId: context.roomId,
        }),
      ),
    reportHome: () => Tuple.make(ParentMessage.RequestedReportHome()),
  },
  EffectsLayer: Layer.empty,
})

const ParentPolicyComposition = ParentPolicyDefinition.makeComposition({
  childBindings: [ParentCommandHomeBinding],
})
const resetParentCommandHome = ParentPolicyDefinition.step(_model =>
  ParentCommandHomeBinding.reset(),
)
const reportParentCommandHome = ParentPolicyDefinition.step(_model =>
  ParentCommandHomeBinding.report(),
)
const foldParentPolicy = ParentPolicyComposition.makeUpdate((model, message) =>
  PolicyMessage.match(message, {
    RequestedResetHome: () => resetParentCommandHome(model),
    RequestedReportHome: () => reportParentCommandHome(model),
    CompletedPolicyWork: () => ({ model }),
  }),
)
const ParentPolicyRuntime = ParentPolicyComposition.makeBlock({
  init: () => ({ model: initialParent }),
  update: foldParentPolicy,
  operations: {
    resetParentCommandHome: () =>
      Tuple.make(PolicyMessage.RequestedResetHome()),
    reportParentCommandHome: () =>
      Tuple.make(PolicyMessage.RequestedReportHome()),
  },
  EffectsLayer: Layer.empty,
  hostHandlers: [RunPolicyWork],
})

const callFoldDataLast = () =>
  // @ts-expect-error fold executes immediately and requires the parent Model
  HomeBinding.fold(ChildMessage.ChangedCount({ amount: 3 }), { roomId: 'room' })
void callFoldDataLast

const ArityModel = Schema.Struct({ count: Schema.Number })
type ArityModel = typeof ArityModel.Type

const ArityMessage = defineMessageUnion({
  RequestedDefaultIncrement: { amount: Schema.optionalKey(Schema.Number) },
  RequestedAddMany: { amounts: Schema.Array(Schema.Number) },
  RequestedAddWithRequiredPrefix: {
    first: Schema.Number,
    labels: Schema.Array(Schema.String),
  },
  RequestedAddWithOptionalPrefix: {
    first: Schema.optionalKey(Schema.Number),
    labels: Schema.Array(Schema.String),
  },
  RequestedAddMixed: {
    values: Schema.Array(Schema.Union([Schema.Number, Schema.String])),
  },
  RequestedReset: {},
  IncreasedCount: {},
})
type ArityMessage = typeof ArityMessage.Type

const ArityParentMessage = defineMessageUnion({
  GotWrappedMessage: { message: ArityMessage, amount: Schema.Number },
  GotIgnoredMessage: { message: ArityMessage },
  GotDefaultMessage: { message: ArityMessage },
  GotOptionalMessage: { message: ArityMessage },
  RequestedDefaultIncrement: { amount: Schema.optionalKey(Schema.Number) },
  RequestedAddMany: { amounts: Schema.Array(Schema.Number) },
  RequestedReset: {},
})
type ArityParentMessage = typeof ArityParentMessage.Type

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
const WrappedArityOwner = define('BindingWrappedArity')
const WrappedArityDefinition = WrappedArityOwner.define({
  Model: ArityModel,
  Message: ArityMessage,
})
const WrappedArityComposition = WrappedArityDefinition.makeComposition()
const defaultIncrement = WrappedArityDefinition.step(
  (model: ArityModel, amount: number = 1) => ({
    model: modifyFields(model, { count: count => count + amount }),
  }),
)
const addMany = WrappedArityDefinition.step(
  (model: ArityModel, ...amounts: ReadonlyArray<number>) => ({
    model: modifyFields(model, {
      count: count =>
        count + amounts.reduce((total, amount) => total + amount, 0),
    }),
  }),
)
const resetArity = WrappedArityDefinition.step((model: ArityModel) => ({
  model: modifyFields(model, { count: () => 0 }),
}))
const wrappedArityUpdate = WrappedArityComposition.makeUpdate(
  (
    ...[model, message, context]: [
      model: ArityModel,
      message: ArityMessage,
      context: Readonly<{ amount: number }>,
    ]
  ) =>
    ArityMessage.match(message, {
      RequestedDefaultIncrement: ({ amount }) =>
        defaultIncrement(model, amount),
      RequestedAddMany: ({ amounts }) => addMany(model, ...amounts),
      RequestedAddWithRequiredPrefix: ({ first, labels }) => ({
        model: modifyFields(model, {
          count: count => count + first + labels.length,
        }),
      }),
      RequestedAddWithOptionalPrefix: ({ first = 0, labels }) => ({
        model: modifyFields(model, {
          count: count => count + first + labels.length,
        }),
      }),
      RequestedAddMixed: ({ values }) => ({
        model: modifyFields(model, {
          count: count => count + values.length,
        }),
      }),
      RequestedReset: () => resetArity(model),
      IncreasedCount: () => ({
        model: modifyFields(model, {
          count: count => count + context.amount,
        }),
      }),
    }),
)
const WrappedArityBlock = WrappedArityComposition.makeBlock({
  init: () => ({ model: ArityModel.make({ count: 0 }) }),
  update: wrappedArityUpdate,
  operations: {
    defaultIncrement: (amount?: number) =>
      Tuple.make(
        ArityMessage.RequestedDefaultIncrement(
          amount === undefined ? {} : { amount },
        ),
        { amount: 0 },
      ),
    addMany: (...amounts: ReadonlyArray<number>) =>
      Tuple.make(ArityMessage.RequestedAddMany({ amounts }), { amount: 0 }),
    addWithRequiredPrefix: (
      ...[first, ...labels]: readonly [first: number, ...labels: Array<string>]
    ) =>
      Tuple.make(
        ArityMessage.RequestedAddWithRequiredPrefix({ first, labels }),
        { amount: 0 },
      ),
    addWithOptionalPrefix: (
      ...[first, ...labels]: readonly [first?: number, ...labels: Array<string>]
    ) =>
      Tuple.make(
        ArityMessage.RequestedAddWithOptionalPrefix(
          first === undefined ? { labels } : { first, labels },
        ),
        { amount: 0 },
      ),
    addMixed: (...values: ReadonlyArray<number | string>) =>
      Tuple.make(ArityMessage.RequestedAddMixed({ values }), { amount: 0 }),
    addRefined: (...amounts: ReadonlyArray<1 | 2>) =>
      Tuple.make(ArityMessage.RequestedAddMany({ amounts }), { amount: 0 }),
    resetArity: () => Tuple.make(ArityMessage.RequestedReset(), { amount: 0 }),
  },
  EffectsLayer: Layer.empty,
})
const WrappedArityParent = define('BindingWrappedArityParent', {
  Model: ArityParent,
  Message: ArityParentMessage,
})
const WrappedArityBinding = WrappedArityParent.bindChild(WrappedArityBlock, {
  placement: 'wrapped-arity',
  read: readArityChild,
  write: writeArityChild,
  toParentMessage: message =>
    ArityParentMessage.GotWrappedMessage({ message, amount: 1 }),
  fromParentMessage: {
    parentMessage: ArityParentMessage.GotWrappedMessage,
    args: (_model, { message, amount }) => Option.some([message, { amount }]),
  },
})

const embedViewlessBlockWithoutView = () =>
  // @ts-expect-error a viewless block requires an explicit view
  WrappedArityBinding.embedView({
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
  childBindings: [],
  init: (): Update.Return<ArityModel, ArityMessage> => ({
    model: ArityModel.make({ count: 0 }),
  }),
  update,
  operations: {},
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
const IgnoredMessageBinding = WrappedArityParent.bindChild(IgnoredMessage, {
  placement: 'ignored-message',
  read: readArityChild,
  write: writeArityChild,
  toParentMessage: message => ArityParentMessage.GotIgnoredMessage({ message }),
  fromParentMessage: {
    parentMessage: ArityParentMessage.GotIgnoredMessage,
    args: (_model, { message }) => Option.some([message]),
  },
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
const DefaultContextBinding = WrappedArityParent.bindChild(DefaultContext, {
  placement: 'default-context',
  read: readArityChild,
  write: writeArityChild,
  toParentMessage: message => ArityParentMessage.GotDefaultMessage({ message }),
  fromParentMessage: {
    parentMessage: ArityParentMessage.GotDefaultMessage,
    args: (_model, { message }) => Option.some([message]),
  },
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
const OptionalContextBinding = WrappedArityParent.bindChild(OptionalContext, {
  placement: 'optional-context',
  read: readArityChild,
  write: writeArityChild,
  toParentMessage: message =>
    ArityParentMessage.GotOptionalMessage({ message }),
  fromParentMessage: {
    parentMessage: ArityParentMessage.GotOptionalMessage,
    args: (_model, { message }) => Option.some([message]),
  },
})

const WrappedArityParentComposition = WrappedArityParent.makeComposition({
  childBindings: [
    WrappedArityBinding,
    IgnoredMessageBinding,
    DefaultContextBinding,
    OptionalContextBinding,
  ],
})
const foldWrappedArity = WrappedArityParentComposition.makeUpdate(model => ({
  model,
}))
const runDefaultIncrement = WrappedArityParent.step(
  (_model, amount?: number) => {
    if (amount === undefined) {
      return WrappedArityBinding.defaultIncrement()
    } else {
      return WrappedArityBinding.defaultIncrement(amount)
    }
  },
)
const runAddMany = WrappedArityParent.step(
  (_model, ...amounts: ReadonlyArray<number>) =>
    WrappedArityBinding.addMany(...amounts),
)
const runResetArity = WrappedArityParent.step(_model =>
  WrappedArityBinding.resetArity(),
)
const WrappedArityRuntime = WrappedArityParentComposition.makeBlock({
  init: () => ({ model: initialArityParent }),
  update: WrappedArityParentComposition.makeUpdate((model, message) =>
    ArityParentMessage.match(message, {
      RequestedDefaultIncrement: ({ amount }) =>
        runDefaultIncrement(model, amount),
      RequestedAddMany: ({ amounts }) => runAddMany(model, ...amounts),
      RequestedReset: () => runResetArity(model),
    }),
  ),
  operations: {
    runDefaultIncrement: (amount?: number) =>
      Tuple.make(
        ArityParentMessage.RequestedDefaultIncrement(
          amount === undefined ? {} : { amount },
        ),
      ),
    runAddMany: (...amounts: ReadonlyArray<number>) =>
      Tuple.make(ArityParentMessage.RequestedAddMany({ amounts })),
    runResetArity: () => Tuple.make(ArityParentMessage.RequestedReset()),
  },
  EffectsLayer: Layer.empty,
})

const foldIgnoredMessage = WrappedArityParentComposition.makeUpdate(model => ({
  model,
}))
const foldDefaultContext = WrappedArityParentComposition.makeUpdate(model => ({
  model,
}))
const foldOptionalContext = WrappedArityParentComposition.makeUpdate(model => ({
  model,
}))

describe('Block binding', () => {
  it('preserves contextual update arguments without a deferred update member', () => {
    const result = foldHome(
      initialParent,
      ParentMessage.GotChildMessage({
        message: ChildMessage.ChangedCount({ amount: 3 }),
        roomId: 'room',
      }),
    )

    expect(Option.getOrThrow(result.model.maybeChild).count).toBe(9)
    expect(HomeBinding).not.toHaveProperty('step')
    expectTypeOf<
      'step' extends keyof typeof HomeBinding ? true : false
    >().toEqualTypeOf<false>()

    expectTypeOf(result).toEqualTypeOf<
      Update.WithRegistrationEvidence<
        Update.ReturnWithOutMessage<
          ParentModel,
          ParentMessage,
          ParentOutMessage,
          Scoped<'home', Command.HandlerOf<typeof Save>>
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
    const result = foldHome(
      parentWithoutChild,
      ParentMessage.GotChildMessage({
        message: ChildMessage.ChangedCount({ amount: 3 }),
        roomId: 'room',
      }),
    )

    expect(result).toEqual({ model: parentWithoutChild })
  })

  it('projects exposed operations directly and preserves their argument tuples', () => {
    const resetResult = ParentRuntime.operations.resetHome(initialParent)
    const contextualResult = ParentRuntime.operations.addHomeForRoom(
      initialParent,
      3,
      {
        roomId: 'room',
      },
    )

    expect(Option.getOrThrow(resetResult.model.maybeChild).count).toBe(0)
    expect(Option.getOrThrow(contextualResult.model.maybeChild).count).toBe(9)
    expectTypeOf(HomeBinding.addForRoom).parameters.toEqualTypeOf<
      [amount: number, context: Readonly<{ roomId: string }>]
    >()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof HomeBinding.save>>
    >().toEqualTypeOf<Qualify<'home', Command.HandlerOf<typeof Save>>>()
  })

  it('handles OutMessages locally and gives a derived result precedence over forwarding', () => {
    const result = foldHome(
      initialParent,
      ParentMessage.GotChildMessage({
        message: ChildMessage.ReportedCount(),
        roomId: 'room',
      }),
    )
    const stepResult = ParentRuntime.operations.reportHome(initialParent)

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
      inspectBinding(HomeBinding).subscriptions.ticks.modelToDependencies(
        gatedParent,
      )
    const updateResult = foldHome(
      gatedParent,
      ParentMessage.GotChildMessage({
        message: ChildMessage.ChangedCount({ amount: 1 }),
        roomId: 'x',
      }),
    )

    expect(Option.isNone(dependencies.maybeDependencies)).toBe(true)
    expect(Option.getOrThrow(updateResult.model.maybeChild).count).toBe(4)
  })

  it('applies one Subscription gate across every child entry', () => {
    const GatedBinding = Parent.bindChild(Child, {
      placement: 'gated-home',
      read: (model: ParentModel) => model.maybeChild,
      write: writeChild,
      toParentMessage,
      fromParentMessage: {
        parentMessage: ParentMessage.GotChildMessage,
        args: (_model, { message, roomId }) =>
          Option.some([message, { roomId }]),
      },
      outMessage: { fold: foldChildOutMessage },
      subscriptions: {
        when: (model: ParentModel) => model.isListening,
      },
    })
    const dependencies = inspectBinding(
      GatedBinding,
    ).subscriptions.ticks.modelToDependencies({
      ...initialParent,
      isListening: false,
    })

    expect(Option.isNone(dependencies.maybeDependencies)).toBe(true)
  })

  it('preserves FoldContext Command lifting and exact requirements', () => {
    const result = foldCommandHome(
      initialParent,
      ParentMessage.GotChildMessage({
        message: ChildMessage.ReportedCount(),
        roomId: 'room',
      }),
    )

    expect(result.commands).toHaveLength(1)
    expectTypeOf<
      Update.RequirementsOf<typeof CommandHomeBinding.fold>
    >().toEqualTypeOf<Qualify<'command-home', Command.HandlerOf<typeof Save>>>()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof CommandHomeBinding.report>>
    >().toEqualTypeOf<Qualify<'command-home', Command.HandlerOf<typeof Save>>>()
  })

  it('keeps forward-only policy requirements separate from child producers', () => {
    const result = foldForwardOnlyHome(
      initialParent,
      ParentMessage.GotChildMessage({
        message: ChildMessage.ReportedCount(),
        roomId: 'room',
      }),
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
          Scoped<'forward-only-home', Command.HandlerOf<typeof Save>>
        >,
        BindingRequirement<'forward-only-home', typeof Child>
      >
    >()
    expectTypeOf<
      Update.RequirementsOf<typeof ForwardOnlyHomeBinding.fold>
    >().toEqualTypeOf<
      Scoped<'forward-only-home', Command.HandlerOf<typeof Save>>
    >()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof ForwardOnlyHomeBinding.save>>
    >().toEqualTypeOf<
      Qualify<'forward-only-home', Command.HandlerOf<typeof Save>>
    >()
  })

  it('keeps raw policy obligations opaque and resolves their exact channels in the Composition', () => {
    const reset =
      ParentPolicyRuntime.operations.resetParentCommandHome(initialParent)
    const report =
      ParentPolicyRuntime.operations.reportParentCommandHome(initialParent)

    expect(reset.commands).toEqual([])
    expect(report.commands).toHaveLength(1)
    expectTypeOf<
      ReturnType<ReturnType<typeof ParentCommandHomeBinding.reset>>
    >().toEqualTypeOf<
      Update.ResultRecipe<
        ParentModel,
        PolicyMessage,
        never,
        Scoped<'parent-command-home', Command.HandlerOf<typeof Save>>,
        | BindingRequirement<'parent-command-home', typeof Child>
        | Update.DeferredResultEvidence<
            DeferredBindingPolicy<'parent-command-home', 'BindingChild'>
          >
      >
    >()
    expectTypeOf<
      ReturnType<ReturnType<typeof ParentCommandHomeBinding.report>>
    >().toEqualTypeOf<
      Update.ResultRecipe<
        ParentModel,
        PolicyMessage,
        never,
        Scoped<'parent-command-home', Command.HandlerOf<typeof Save>>,
        | BindingRequirement<'parent-command-home', typeof Child>
        | Update.DeferredResultEvidence<
            DeferredBindingPolicy<'parent-command-home', 'BindingChild'>
          >
      >
    >()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof ParentCommandHomeBinding.reset>>
    >().toEqualTypeOf<
      Scoped<'parent-command-home', Command.HandlerOf<typeof Save>>
    >()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof ParentCommandHomeBinding.report>>
    >().toEqualTypeOf<
      Scoped<'parent-command-home', Command.HandlerOf<typeof Save>>
    >()
    expectTypeOf<
      Update.RequirementsOf<typeof foldParentPolicy>
    >().toEqualTypeOf<
      | Scoped<'parent-command-home', Command.HandlerOf<typeof Save>>
      | Command.HandlerOf<typeof RunPolicyWork>
    >()
    expectTypeOf<
      Update.RegistrationEvidenceOf<ReturnType<typeof foldParentPolicy>>
    >().toEqualTypeOf<BindingRequirement<'parent-command-home', typeof Child>>()
    expectTypeOf<
      CommandMessageOfReturn<ReturnType<typeof foldParentPolicy>>
    >().toEqualTypeOf<PolicyMessage>()
    expectTypeOf(reset.outMessage).toEqualTypeOf<ParentOutMessage | undefined>()
    expectTypeOf(report.outMessage).toEqualTypeOf<
      ParentOutMessage | undefined
    >()
  })

  it('keeps source handles readable and qualifies collected registrations', () => {
    const aggregated = aggregateChildren([HomeBinding])
    const declarations = Subscription.__messageDeclarations(
      aggregated.subscriptions,
    )

    expect(childSubscriptions.ticks.name).toBe('BindingChild/ObserveTicks')
    expect(inspectBinding(HomeBinding).subscriptions.ticks.name).toBe(
      'home/ObserveTicks',
    )
    expect(inspectBinding(HomeBinding).managedResources.session.name).toBe(
      'home/ManageSession',
    )
    expect(
      inspectBinding(HomeBinding).managedResources.session.resource._tag.key,
    ).not.toBe(Session._tag.key)
    expect(aggregated.subscriptions['home/ticks']).toBe(
      inspectBinding(HomeBinding).subscriptions.ticks,
    )
    expect(aggregated.managedResources['home/session']).toBe(
      inspectBinding(HomeBinding).managedResources.session,
    )
    expect(declarations).toHaveLength(1)
    expect(declarations[0]).toMatchObject({
      entry: inspectBinding(HomeBinding).subscriptions.ticks,
      entryKey: 'home/ticks',
    })
    expect(declarations[0]?.messageMappers).toHaveLength(1)
  })

  it('preserves lifecycle contracts from a named child array', () => {
    const pulseChild = ChildComposition.makeBlock({
      init: Child.init,
      update: Child.update,
      subscriptions: { pulses: childSubscriptions.ticks },
      EffectsLayer: Layer.empty,
      hostHandlers: [Save, childSubscriptions.ticks, Measure],
    })
    const ParentSchema = Schema.Struct({
      maybeChild: Schema.Option(ChildModel),
      reports: Schema.Array(Schema.Number),
      isListening: Schema.Boolean,
    })
    const NamedParentMessage = defineMessageUnion({
      GotHomeMessage: { message: ChildMessage, roomId: Schema.String },
      GotRoomMessage: { message: ChildMessage, roomId: Schema.String },
    })
    type NamedParentMessage = typeof NamedParentMessage.Type
    const foldNamedChildOutMessage = ChildOutMessage.match<
      Update.StepWithOutMessage<
        ParentModel,
        NamedParentMessage,
        ParentOutMessage
      >
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
    const ParentBaseDefinition = define('BindingNamedChildren').define({
      Model: ParentSchema,
      Message: NamedParentMessage,
      OutMessage: ParentOutMessage,
    })
    const NamedHomeBinding = ParentBaseDefinition.bindChild(Child, {
      placement: 'home',
      read: (model: ParentModel) => model.maybeChild,
      write: writeChild,
      toParentMessage: message =>
        NamedParentMessage.GotHomeMessage({ message, roomId: 'room' }),
      fromParentMessage: {
        parentMessage: NamedParentMessage.GotHomeMessage,
        args: (_model, { message, roomId }) =>
          Option.some([message, { roomId }]),
      },
      outMessage: { fold: foldNamedChildOutMessage },
    })
    const RoomBinding = ParentBaseDefinition.bindChild(pulseChild, {
      placement: 'room',
      read: (model: ParentModel) => model.maybeChild,
      write: writeChild,
      toParentMessage: message =>
        NamedParentMessage.GotRoomMessage({ message, roomId: 'room' }),
      fromParentMessage: {
        parentMessage: NamedParentMessage.GotRoomMessage,
        args: (_model, { message, roomId }) =>
          Option.some([message, { roomId }]),
      },
      outMessage: { fold: foldNamedChildOutMessage },
    })
    const namedHomeInspection = inspectBinding(NamedHomeBinding)
    const childBindings = [NamedHomeBinding, RoomBinding]
    const parentContract = ParentBaseDefinition.makeComposition({
      childBindings,
    })
    const parent = parentContract.makeBlock({
      init: () => ({ model: initialParent }),
      update: (model, _message) => ({ model }),
      EffectsLayer: Layer.empty,
    })

    const inline = aggregateChildren([NamedHomeBinding, RoomBinding])

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
      typeof namedHomeInspection.subscriptions.ticks
    >()
    expectTypeOf(parent.managedResources['home/session']).toEqualTypeOf<
      typeof namedHomeInspection.managedResources.session
    >()
    expect(parent.subscriptions['home/ticks']).toBe(
      inspectBinding(NamedHomeBinding).subscriptions.ticks,
    )
    expect(parent.subscriptions['room/pulses']).toBe(
      inspectBinding(RoomBinding).subscriptions.pulses,
    )
    expect(parent.managedResources['home/session']).toBe(
      inspectBinding(NamedHomeBinding).managedResources.session,
    )
  })

  it('uses the canonical view across explicit slots and accepts a typed override', () => {
    const childModel = Option.getOrThrow(initialParent.maybeChild)
    const desktop = HomeBinding.embedView({
      slotId: 'desktop-home',
      model: childModel,
    })
    const mobile = HomeBinding.embedView({
      slotId: 'mobile-home',
      model: childModel,
    })
    const detailed = HomeBinding.embedView({
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
    const message = ArityParentMessage.GotWrappedMessage({
      message: ArityMessage.IncreasedCount(),
      amount: 2,
    })
    const folded = foldWrappedArity(initialArityParent, message)

    expect(WrappedArityBlock.update.length).toBe(2)
    expect(folded.model.child.count).toBe(2)
    expectTypeOf(folded).toEqualTypeOf<
      Update.WithRegistrationEvidence<
        Update.Return<ArityParent, typeof ArityParentMessage.Type>,
        | BindingRequirement<'wrapped-arity', typeof WrappedArityBlock>
        | BindingRequirement<'ignored-message', typeof IgnoredMessage>
        | BindingRequirement<'default-context', typeof DefaultContext>
        | BindingRequirement<'optional-context', typeof OptionalContext>
      >
    >()
  })

  it('supplies the declared Message when the update implementation ignores it', () => {
    const message = ArityParentMessage.GotIgnoredMessage({
      message: ArityMessage.IncreasedCount(),
    })
    const folded = foldIgnoredMessage(initialArityParent, message)

    expect(IgnoredMessage.update.length).toBe(1)
    expect(folded.model.child.count).toBe(1)
  })

  it('preserves default and optional update context', () => {
    const defaultMessage = ArityParentMessage.GotDefaultMessage({
      message: ArityMessage.IncreasedCount(),
    })
    const optionalMessage = ArityParentMessage.GotOptionalMessage({
      message: ArityMessage.IncreasedCount(),
    })
    const defaultFold = foldDefaultContext(initialArityParent, defaultMessage)
    const optionalFold = foldOptionalContext(
      initialArityParent,
      optionalMessage,
    )

    expect(defaultFold.model.child.count).toBe(2)
    expect(optionalFold.model.child.count).toBe(1)
  })

  it('returns Steps uniformly for noarg, defaulted, and rest producers', () => {
    const defaultResult =
      WrappedArityRuntime.operations.runDefaultIncrement(initialArityParent)
    const explicitDefaultResult =
      WrappedArityRuntime.operations.runDefaultIncrement(initialArityParent, 4)
    const restResult = WrappedArityRuntime.operations.runAddMany(
      initialArityParent,
      2,
      3,
    )
    const requiredPrefixResult =
      WrappedArityBlock.operations.addWithRequiredPrefix(
        initialArityParent.child,
        2,
        'first',
        'second',
      )
    const optionalPrefixResult =
      WrappedArityBlock.operations.addWithOptionalPrefix(
        initialArityParent.child,
        undefined,
        'first',
      )
    const mixedResult = WrappedArityBlock.operations.addMixed(
      initialArityParent.child,
      1,
      'first',
    )
    const refinedResult = WrappedArityBlock.operations.addRefined(
      initialArityParent.child,
      1,
      2,
    )
    const resetResult = WrappedArityRuntime.operations.runResetArity({
      child: ArityModel.make({ count: 8 }),
    })

    expect(defaultIncrement.length).toBe(1)
    expect(addMany.length).toBe(1)
    expect(defaultResult.model.child.count).toBe(1)
    expect(explicitDefaultResult.model.child.count).toBe(4)
    expect(restResult.model.child.count).toBe(5)
    expect(requiredPrefixResult.model.count).toBe(4)
    expect(optionalPrefixResult.model.count).toBe(1)
    expect(mixedResult.model.count).toBe(2)
    expect(refinedResult.model.count).toBe(3)
    expect(resetResult.model.child.count).toBe(0)
    expectTypeOf(WrappedArityBinding.defaultIncrement).parameters.toEqualTypeOf<
      [amount?: number | undefined]
    >()
    expectTypeOf(WrappedArityBlock.operations.addMany).parameters.toEqualTypeOf<
      [model: ArityModel, ...amounts: Array<number>]
    >()
    expectTypeOf(
      WrappedArityBlock.operations.addWithRequiredPrefix,
    ).parameters.toEqualTypeOf<
      [model: ArityModel, first: number, ...labels: Array<string>]
    >()
    expectTypeOf(
      WrappedArityBlock.operations.addWithOptionalPrefix,
    ).parameters.toEqualTypeOf<
      [model: ArityModel, first?: number, ...labels: Array<string>]
    >()
    expectTypeOf(
      WrappedArityBlock.operations.addMixed,
    ).parameters.toEqualTypeOf<
      [model: ArityModel, ...values: Array<number | string>]
    >()
    expectTypeOf(
      WrappedArityBlock.operations.addRefined,
    ).parameters.toEqualTypeOf<[model: ArityModel, ...amounts: Array<1 | 2>]>()
    expectTypeOf(WrappedArityBinding.addMany).parameters.toEqualTypeOf<
      [...amounts: Array<number>]
    >()
    expectTypeOf(
      WrappedArityBinding.addWithRequiredPrefix,
    ).parameters.toEqualTypeOf<[first: number, ...labels: Array<string>]>()
    expectTypeOf(
      WrappedArityBinding.addWithOptionalPrefix,
    ).parameters.toEqualTypeOf<[first?: number, ...labels: Array<string>]>()
    expectTypeOf(WrappedArityBinding.addMixed).parameters.toEqualTypeOf<
      Array<number | string>
    >()
    expectTypeOf(WrappedArityBinding.addRefined).parameters.toEqualTypeOf<
      Array<1 | 2>
    >()
    expectTypeOf(WrappedArityBinding.resetArity).parameters.toEqualTypeOf<[]>()
  })
})

if (false) {
  const addWithPrefix = WrappedArityBlock.operations.addWithRequiredPrefix
  // @ts-expect-error The required variadic prefix cannot be omitted.
  addWithPrefix(initialArityParent.child)
  // @ts-expect-error Variadic labels must be strings.
  addWithPrefix(initialArityParent.child, 1, 2)
}

describe('Block child registration composition', () => {
  it('gives repeated ManagedResources independent placement capability keys', () => {
    const SidebarBinding = Parent.bindChild(Child, {
      placement: 'sidebar',
      read: (model: ParentModel) => model.maybeChild,
      write: writeChild,
      toParentMessage,
      fromParentMessage: {
        parentMessage: ParentMessage.GotChildMessage,
        args: (_model, { message, roomId }) =>
          Option.some([message, { roomId }]),
      },
      outMessage: { fold: foldChildOutMessage },
    })

    const aggregated = aggregateChildren([HomeBinding, SidebarBinding])
    expect(Object.keys(aggregated.managedResources)).toEqual([
      'home/session',
      'sidebar/session',
    ])
    expect(
      inspectBinding(HomeBinding).managedResources.session.resource._tag.key,
    ).not.toBe(
      inspectBinding(SidebarBinding).managedResources.session.resource._tag.key,
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
      const RepeatedBaseDefinition = RepeatedOwner.define({
        Model: ChildModel,
        Message: RepeatedMessage,
      })
      const RepeatedComposition = RepeatedBaseDefinition.makeComposition({
        mounts: [RepeatedMount],
      })
      const EffectsLayer = Layer.sync(BuildMarker, () => {
        buildCount += 1
        return {}
      })
      const Repeated = RepeatedComposition.makeBlock({
        init: () => ({ model: ChildModel.make({ count: 0 }) }),
        update: model => ({ model }),
        EffectsLayer,
        hostHandlers: [RepeatedMount],
      })
      const RepeatedParentModel = Schema.Struct({ child: ChildModel })
      type RepeatedParentModel = typeof RepeatedParentModel.Type
      const RepeatedParentMessage = defineMessageUnion({
        GotChildMessage: { message: RepeatedMessage },
      })
      const RepeatedParent = define('BindingRepeatedParent', {
        Model: RepeatedParentModel,
        Message: RepeatedParentMessage,
      })
      const bindRepeated = (placement: 'first' | 'second') =>
        RepeatedParent.bindChild(Repeated, {
          placement,
          read: (model: RepeatedParentModel) => Option.some(model.child),
          write: (model, child) => ({ ...model, child }),
          parentMessage: RepeatedParentMessage.GotChildMessage,
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
    const RequestedFinish = Schema.TaggedStruct('RequestedFinish', {})
    const Message = Schema.Union([
      RequestedFinish,
      Schema.TaggedStruct('SelectedValue', { value: Value }),
      CompletedChoiceWork,
    ])
    type Message = typeof Message.Type
    const OutMessage = Schema.TaggedStruct('SelectedValue', { value: Value })
    type OutMessage = typeof OutMessage.Type
    const ChoiceDefinition = GenericOwner.define({ Model, Message, OutMessage })
    const Composition = ChoiceDefinition.makeComposition()
    const finish = ChoiceDefinition.step(model => ({
      model,
      commands: [FinishChoice()],
    }))
    const update = Composition.makeUpdate((model, message) => {
      if (message._tag === 'RequestedFinish') {
        return finish(model)
      } else if (message._tag === 'SelectedValue') {
        return {
          model: Model.make({ value: message.value }),
          outMessage: OutMessage.make({ value: message.value }),
        }
      } else {
        return { model }
      }
    })
    return Composition.makeBlock({
      init: (value: Value) => ({ model: Model.make({ value }) }),
      update,
      operations: {
        finish: () => Tuple.make(RequestedFinish.make({})),
      },
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
    const ChoiceParentMessage = defineMessageUnion({
      GotChoiceMessage: { message: Choice.Message },
    })
    type DeclaredOutMessage =
      typeof Choice extends Readonly<{
        OutMessage: Readonly<{ Type: infer OutMessage }>
      }>
        ? OutMessage
        : never
    expectTypeOf<DeclaredOutMessage>().toEqualTypeOf<ChoiceOutMessage>()
    const ChoiceParent = define('BindingChoiceParent', {
      Model: ChoiceParentModel,
      Message: ChoiceParentMessage,
      OutMessage: Choice.OutMessage,
    })
    const directChoicePolicy = {
      fold: (outMessage: ChoiceOutMessage) => (model: ChoiceParentModel) => ({
        model,
        outMessage,
      }),
    }
    const DirectBinding = ChoiceParent.bindChild(Choice, {
      placement: 'direct-choice',
      read: (model: ChoiceParentModel) => Option.some(model.choice),
      write: (model, choice) => ({ ...model, choice }),
      toParentMessage: message =>
        ChoiceParentMessage.GotChoiceMessage({ message }),
      fromParentMessage: {
        parentMessage: ChoiceParentMessage.GotChoiceMessage,
        args: (_model, { message }) => Option.some([message]),
      },
      outMessage: directChoicePolicy,
    })
    const Binding = ChoiceParent.bindChild(Choice, {
      placement: 'choice',
      read: (model: ChoiceParentModel) => Option.some(model.choice),
      write: (model: ChoiceParentModel, choice: ChoiceModel) => ({
        ...model,
        choice,
      }),
      parentMessage: ChoiceParentMessage.GotChoiceMessage,
      outMessage: {
        fold: (outMessage: ChoiceOutMessage) => (model: ChoiceParentModel) => ({
          model,
          outMessage,
        }),
      },
    })
    const foldChoice = ChoiceParent.makeComposition({
      childBindings: [Binding],
    }).makeUpdate()

    const result = foldChoice(
      { choice: Choice.Model.make({ value: 'One' }) },
      ChoiceParentMessage.GotChoiceMessage({
        message: { _tag: 'SelectedValue', value: 'Two' },
      }),
    )

    expect(result.outMessage).toEqual({ _tag: 'SelectedValue', value: 'Two' })
    expectTypeOf<ReturnType<typeof DirectBinding.fold>>().toEqualTypeOf<
      Update.ResultRecipe<
        ChoiceParentModel,
        typeof ChoiceParentMessage.Type,
        never,
        Scoped<'direct-choice', Command.HandlerOf<typeof FinishChoice>>,
        | BindingRequirement<'direct-choice', typeof Choice>
        | Update.DeferredResultEvidence<
            DeferredBindingPolicy<'direct-choice', 'BindingChoice'>
          >
      >
    >()
    expectTypeOf(result.outMessage).toEqualTypeOf<
      ChoiceOutMessage | undefined
    >()
    expectTypeOf<
      Update.RequirementsOf<ReturnType<typeof Binding.finish>>
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
