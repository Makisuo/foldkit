import { Array, Layer, Option, Schema, Tuple } from 'effect'
import { expect, it, vi } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import * as Update from '../update/index.js'
import { define } from './define.js'
import { lowerBlock } from './lowering.js'

const ChildModel = Schema.Struct({ count: Schema.Number })
type ChildModel = typeof ChildModel.Type

const Message = defineMessageUnion({
  RequestedReset: {},
  Advanced: {},
  CompletedRecordBeforeReplay: {},
  CompletedRecordAfterReplay: {},
})
type Message = typeof Message.Type
const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: Message },
  Advanced: {},
  CompletedRecordBeforeReplay: {},
  CompletedRecordAfterReplay: {},
  RequestedInitializeChild: {},
})

const ParentModel = Schema.Struct({
  primary: ChildModel,
  sibling: ChildModel,
})
type ParentModel = typeof ParentModel.Type

const initialModel = ParentModel.make({
  primary: ChildModel.make({ count: 1 }),
  sibling: ChildModel.make({ count: 2 }),
})

const ChildOwner = define('OperationGraphChild')
const ChildDefinition = ChildOwner.define({ Model: ChildModel, Message })
const resetInvocation = vi.fn()
const reset = ChildDefinition.step(_model => {
  resetInvocation()

  return { model: ChildModel.make({ count: 0 }) }
})
const ChildComposition = ChildDefinition.makeComposition()
const ChildBlock = ChildComposition.makeBlock({
  view: ChildComposition.makeView((_model, h) => h.div([])),
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: ChildComposition.makeUpdate((model, message) =>
    Message.match(message, {
      RequestedReset: () => reset(model),
      Advanced: () => ({
        model: modifyFields(model, { count: count => count + 1 }),
      }),
      CompletedRecordBeforeReplay: () => ({
        model: modifyFields(model, { count: count => count + 1 }),
      }),
      CompletedRecordAfterReplay: () => ({
        model: modifyFields(model, { count: count => count + 1 }),
      }),
    }),
  ),
  operations: { reset: () => Tuple.make(Message.RequestedReset()) },
  EffectsLayer: Layer.empty,
})

const OmittedParentDefinition = define('OperationGraphOmittedParent').define({
  Model: ParentModel,
  Message: ParentMessage,
})
const OmittedChildBinding = OmittedParentDefinition.bindChild(ChildBlock, {
  placement: 'omitted-child',
  read: (model: ParentModel) => Option.some(model.primary),
  write: (model, nextChild) =>
    modifyFields(model, { primary: () => nextChild }),
  parentMessage: ParentMessage.GotChildMessage,
})

const initializeOmittedChild = OmittedParentDefinition.step(model =>
  OmittedChildBinding.init({
    args: [],
    toParentModel: child => modifyFields(model, { primary: () => child }),
  }),
)
const omittedParentComposition = OmittedParentDefinition.makeComposition({
  childBindings: [OmittedChildBinding],
})
const OmittedParent = omittedParentComposition.makeBlock({
  view: omittedParentComposition.makeView((_model, h) => h.div([])),
  init: () => ({ model: initialModel }),
  update: omittedParentComposition.makeUpdate((model, message) =>
    ParentMessage.match(message, {
      RequestedInitializeChild: () => initializeOmittedChild(model),
      Advanced: () => ({ model }),
      CompletedRecordBeforeReplay: () => ({ model }),
      CompletedRecordAfterReplay: () => ({ model }),
    }),
  ),
  operations: {
    initializeOmittedChild: () =>
      Tuple.make(ParentMessage.RequestedInitializeChild()),
  },
  EffectsLayer: Layer.empty,
})

const ForeignOmittedChildBinding = OmittedParentDefinition.bindChild(
  ChildBlock,
  {
    placement: 'foreign-child',
    read: (model: ParentModel) => Option.some(model.primary),
    write: (model, nextChild) =>
      modifyFields(model, { primary: () => nextChild }),
    parentMessage: ParentMessage.GotChildMessage,
  },
)
const unregisteredParentComposition = OmittedParentDefinition.makeComposition({
  childBindings: [ForeignOmittedChildBinding],
})
const narrowedReset = (model: ParentModel): Readonly<{ model: ParentModel }> =>
  Reflect.apply(OmittedChildBinding.reset(), undefined, [model])
const unregisteredNarrowedReset = Reflect.apply(
  unregisteredParentComposition.makeUpdate,
  undefined,
  [narrowedReset],
)
const registeredNarrowedReset = Reflect.apply(
  omittedParentComposition.makeUpdate,
  undefined,
  [narrowedReset],
)
const unregisteredDiscardedReset = unregisteredParentComposition.makeUpdate(
  model => {
    Reflect.apply(OmittedChildBinding.reset(), undefined, [model])

    return { model }
  },
)

it('runs a completed exposed operation in its registered child graph', () => {
  const recipe = Reflect.apply(initializeOmittedChild, undefined, [
    initialModel,
  ])

  expect(recipe).not.toHaveProperty('model')
  expect(recipe).not.toHaveProperty('commands')

  const initialized =
    OmittedParent.operations.initializeOmittedChild(initialModel)

  expect(initialized.model.primary.count).toBe(0)
})

it('runs a narrowed bound operation in its registered child graph', () => {
  const result = Reflect.apply(registeredNarrowedReset, undefined, [
    initialModel,
    ParentMessage.Advanced(),
  ])

  expect(result).toMatchObject({ model: { primary: { count: 0 } } })
})

it('rejects an unregistered bound operation after its result is narrowed', () => {
  expect(() =>
    Reflect.apply(unregisteredNarrowedReset, undefined, [
      initialModel,
      ParentMessage.Advanced(),
    ]),
  ).toThrow(
    'The child binding at placement "omitted-child" is not registered in the current Block graph.',
  )
})

it('does no child work when an erased unregistered result is discarded', () => {
  const previousInvocationCount = resetInvocation.mock.calls.length
  const resetDiscarded = unregisteredDiscardedReset(
    initialModel,
    ParentMessage.Advanced(),
  )

  expect(resetDiscarded.model).toBe(initialModel)
  expect(resetInvocation).toHaveBeenCalledTimes(previousInvocationCount)
})

interface DiscardedOperation {
  execute(model: ParentModel): void
}

const discardedOperation: DiscardedOperation = {
  execute: OmittedChildBinding.reset(),
}

it('keeps method-shaped void erasure passive outside its registered graph', () => {
  const previousInvocationCount = resetInvocation.mock.calls.length

  discardedOperation.execute(initialModel)

  expect(resetInvocation).toHaveBeenCalledTimes(previousInvocationCount)
})

it('keeps a callback holding a scoped Model passive after its graph returns', () => {
  const callbacks: Array<() => void> = []
  const captureReset = omittedParentComposition.makeUpdate(model => {
    callbacks.push(() => {
      OmittedChildBinding.reset()(model)
    })

    return { model }
  })
  const previousInvocationCount = resetInvocation.mock.calls.length

  captureReset(initialModel, ParentMessage.Advanced())
  Option.getOrThrow(Array.head(callbacks))()

  expect(resetInvocation).toHaveBeenCalledTimes(previousInvocationCount)
})

it('prevents a pending operation from acquiring Model fields or a prototype', () => {
  const recipe = Reflect.apply(OmittedChildBinding.reset(), undefined, [
    initialModel,
  ])

  expect(Object.isFrozen(recipe)).toBe(true)
  expect(Object.getPrototypeOf(recipe)).toBe(null)
  expect(Reflect.set(recipe, 'model', initialModel)).toBe(false)
  expect(Reflect.setPrototypeOf(recipe, { model: initialModel })).toBe(false)
})

const readAllWrongPlacement = vi.fn((model: ParentModel) => [model.primary])
const readWrongPlacement = vi.fn((child: ChildModel) => child)
const writeWrongPlacement = vi.fn((model: ParentModel, nextChild: ChildModel) =>
  modifyFields(model, { primary: () => nextChild }),
)
const ExactParentBaseDefinition = define('OperationGraphExactParent').define({
  Model: ParentModel,
  Message: ParentMessage,
})
const RegisteredPlacementBinding = ExactParentBaseDefinition.bindChild(
  ChildBlock,
  {
    placement: 'same-placement',
    readAll: (model: ParentModel) => [model.primary],
    key: () => 'only',
    read: (child: ChildModel) => child,
    writeAt: (model, _key, nextChild) =>
      modifyFields(model, { primary: () => nextChild }),
    toParentMessage: (_key, message: Message) =>
      ParentMessage.GotChildMessage({ message }),
    fromParentMessage: {
      parentMessage: ParentMessage.GotChildMessage,
      args: (_model, { message }) => Option.some(['only', message]),
    },
  },
)
const WrongPlacementBinding = ExactParentBaseDefinition.bindChild(ChildBlock, {
  placement: 'same-placement',
  readAll: readAllWrongPlacement,
  key: () => 'only',
  read: readWrongPlacement,
  writeAt: (model, _key, nextChild) => writeWrongPlacement(model, nextChild),
  toParentMessage: (_key, message: Message) =>
    ParentMessage.GotChildMessage({ message }),
  fromParentMessage: {
    parentMessage: ParentMessage.GotChildMessage,
    args: (_model, { message }) => Option.some(['only', message]),
  },
})

const exactParentComposition = ExactParentBaseDefinition.makeComposition({
  childBindings: [RegisteredPlacementBinding],
})
const initializeWrongPlacement = ExactParentBaseDefinition.step(model =>
  WrongPlacementBinding.init({
    key: 'only',
    args: [],
    toParentModel: child => modifyFields(model, { primary: () => child }),
  }),
)
const ExactParent = exactParentComposition.makeBlock({
  view: exactParentComposition.makeView((_model, h) => h.div([])),
  init: () => ({ model: initialModel }),
  update: exactParentComposition.makeUpdate((model, message) =>
    ParentMessage.match(message, {
      RequestedInitializeChild: () => initializeWrongPlacement(model),
      Advanced: () =>
        WrongPlacementBinding.fold(model, 'only', Message.Advanced()),
      CompletedRecordBeforeReplay: () => ({ model }),
      CompletedRecordAfterReplay: () => ({ model }),
    }),
  ),
  operations: {
    initializeWrongPlacement: () =>
      Tuple.make(ParentMessage.RequestedInitializeChild()),
  },
  EffectsLayer: Layer.empty,
})

it('checks exact binding identity before reading or writing the parent Model', () => {
  const lowered = lowerBlock(ExactParent)

  expect(() => lowered.update(initialModel, ParentMessage.Advanced())).toThrow(
    'The child binding at placement "same-placement" is not registered in the current Block graph.',
  )
  expect(readAllWrongPlacement).not.toHaveBeenCalled()
  expect(readWrongPlacement).not.toHaveBeenCalled()
  expect(writeWrongPlacement).not.toHaveBeenCalled()
})

it('keeps foreign Bindings out of completed exposed operations', () => {
  expect(() =>
    ExactParent.operations.initializeWrongPlacement(initialModel),
  ).toThrow(
    'The child binding at placement "same-placement" is not registered in the current Block graph.',
  )
})

const PendingEntry = Schema.Struct({
  id: Schema.String,
  child: ChildModel,
})
const PendingParentModel = Schema.Struct({
  entries: Schema.Array(PendingEntry),
  status: Schema.String,
})
const PendingParent = define('PendingParent', {
  Model: PendingParentModel,
  Message: ParentMessage,
})
const PendingChildBinding = PendingParent.bindChild(ChildBlock, {
  field: 'entries',
  key: 'id',
  childField: 'child',
  toParentMessage: (_id, message) => ParentMessage.GotChildMessage({ message }),
  fromParentMessage: {
    parentMessage: ParentMessage.GotChildMessage,
    args: (_model, { message }) => Option.some(['only', message]),
  },
})
const PendingParentComposition = PendingParent.makeComposition({
  childBindings: [PendingChildBinding],
})
const capturedPendingModel = PendingParentModel.make({
  entries: [
    PendingEntry.make({
      id: 'only',
      child: ChildModel.make({ count: 1 }),
    }),
  ],
  status: 'Captured',
})
const pendingRegisteredKeyedReset = Reflect.apply(
  PendingChildBinding.reset('only'),
  undefined,
  [capturedPendingModel],
)
const returnPendingRegisteredKeyedReset = Reflect.apply(
  PendingParentComposition.makeUpdate,
  undefined,
  [() => pendingRegisteredKeyedReset],
)

it('resolves a pending keyed operation against the active Model after its key is removed', () => {
  const modelWithoutKey = modifyFields(capturedPendingModel, {
    entries: () => [],
    status: () => 'Active',
  })
  const previousInvocationCount = resetInvocation.mock.calls.length

  const result = returnPendingRegisteredKeyedReset(
    modelWithoutKey,
    ParentMessage.Advanced(),
  )

  expect(result.model).toBe(modelWithoutKey)
  expect(result.model.status).toBe('Active')
  expect(resetInvocation).toHaveBeenCalledTimes(previousInvocationCount)
})

const RecordBeforeReplay = PendingParent.command('RecordBeforeReplay', {
  messages: [ParentMessage.CompletedRecordBeforeReplay],
})
const RecordAfterReplay = PendingParent.command('RecordAfterReplay', {
  messages: [ParentMessage.CompletedRecordAfterReplay],
})

it('replays a deferred combined operation from the active Model without restoring removed keys', () => {
  const pending = Reflect.apply(Update.combine, undefined, [
    capturedPendingModel,
    [
      (model: typeof PendingParentModel.Type) => ({
        model: modifyFields(model, { status: status => `${status}/Before` }),
        commands: [RecordBeforeReplay()],
      }),
      () => pendingRegisteredKeyedReset,
      (model: typeof PendingParentModel.Type) => ({
        model: modifyFields(model, { status: status => `${status}/After` }),
        commands: [RecordAfterReplay()],
      }),
    ],
  ])
  const replay = Reflect.apply(PendingParentComposition.makeUpdate, undefined, [
    () => pending,
  ])
  const modelWithoutKey = modifyFields(capturedPendingModel, {
    entries: () => [],
    status: () => 'Active',
  })
  const previousInvocationCount = resetInvocation.mock.calls.length

  const result = replay(modelWithoutKey, ParentMessage.Advanced())

  expect(result.model.entries).toEqual([])
  expect(result.model.status).toBe('Active/Before/After')
  expect(result.commands).toMatchObject([
    { name: 'PendingParent/RecordBeforeReplay' },
    { name: 'PendingParent/RecordAfterReplay' },
  ])
  expect(resetInvocation).toHaveBeenCalledTimes(previousInvocationCount)
})

const PolicyOutMessage = defineMessageUnion({ RequestedSiblingReset: {} })
type PolicyOutMessage = typeof PolicyOutMessage.Type

const PolicyOwner = define('OperationGraphPolicyChild')
const PolicyDefinition = PolicyOwner.define({
  Model: ChildModel,
  Message,
  OutMessage: PolicyOutMessage,
})
const policyComposition = PolicyDefinition.makeComposition()
const PolicyChild = policyComposition.makeBlock({
  view: policyComposition.makeView((_model, h) => h.div([])),
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: model => ({
    model,
    outMessage: PolicyOutMessage.RequestedSiblingReset(),
  }),
  EffectsLayer: Layer.empty,
})

const PolicyParentMessage = defineMessageUnion({
  GotPolicyChildMessage: { message: Message },
  GotSiblingChildMessage: { message: Message },
})
const PolicyParentBaseDefinition = define('OperationGraphPolicyParent').define({
  Model: ParentModel,
  Message: PolicyParentMessage,
})
const SiblingChildBinding = PolicyParentBaseDefinition.bindChild(ChildBlock, {
  placement: 'sibling-child',
  read: (model: ParentModel) => Option.some(model.sibling),
  write: (model, nextChild) =>
    modifyFields(model, { sibling: () => nextChild }),
  parentMessage: PolicyParentMessage.GotSiblingChildMessage,
})
const PolicyChildBinding = PolicyParentBaseDefinition.bindChild(PolicyChild, {
  placement: 'policy-child',
  read: (model: ParentModel) => Option.some(model.primary),
  write: (model, nextChild) =>
    modifyFields(model, { primary: () => nextChild }),
  parentMessage: PolicyParentMessage.GotPolicyChildMessage,
  outMessage: {
    fold: (_outMessage: PolicyOutMessage) => SiblingChildBinding.reset(),
  },
})

const policyParentComposition = PolicyParentBaseDefinition.makeComposition({
  childBindings: [PolicyChildBinding, SiblingChildBinding],
})
const PolicyParent = policyParentComposition.makeBlock({
  view: policyParentComposition.makeView((_model, h) => h.div([])),
  init: () => ({ model: initialModel }),
  update: policyParentComposition.makeUpdate(),
  EffectsLayer: Layer.empty,
})

it('restores the parent graph before folding a child OutMessage', () => {
  const lowered = lowerBlock(PolicyParent)

  const result = lowered.update(
    initialModel,
    PolicyParentMessage.GotPolicyChildMessage({ message: Message.Advanced() }),
  )

  expect(result.model.sibling.count).toBe(0)
})
