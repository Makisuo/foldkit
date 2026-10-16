import { Layer, Option, Schema } from 'effect'
import { expect, it, vi } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import { define } from './define.js'
import { lowerBlock } from './lowering.js'

const ChildModel = Schema.Struct({ count: Schema.Number })
type ChildModel = typeof ChildModel.Type

const Message = defineMessageUnion({ Advanced: {} })
type Message = typeof Message.Type

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
const Child = ChildOwner.define({ Model: ChildModel, Message })
const reset = Child.step(_model => ({
  model: ChildModel.make({ count: 0 }),
}))
const ChildComposition = Child.toComposition()
const ChildBlock = ChildComposition.toBlock({
  view: ChildComposition.view((_model, h) => h.div([])),
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: ChildComposition.update(model => ({
    model: modifyFields(model, { count: count => count + 1 }),
  })),
  expose: { reset },
  EffectsLayer: Layer.empty,
})

const omittedParent = define('OperationGraphOmittedParent').define({
  Model: ParentModel,
  Message,
})
const OmittedChildBinding = omittedParent.bindChild(ChildBlock, {
  fromParentMessage: false,
  placement: 'omitted-child',
  read: (model: ParentModel) => Option.some(model.primary),
  write: (model, nextChild) =>
    modifyFields(model, { primary: () => nextChild }),
  toParentMessage: (message: Message) => message,
})

const initializeOmittedChild = omittedParent.step(model =>
  OmittedChildBinding.init({
    args: [],
    toParentModel: child => modifyFields(model, { primary: () => child }),
  }),
)
const omittedParentComposition = omittedParent.toComposition({
  childBindings: [OmittedChildBinding],
})
const OmittedParent = omittedParentComposition.toBlock({
  view: omittedParentComposition.view((_model, h) => h.div([])),
  init: () => ({ model: initialModel }),
  update: model => ({ model }),
  expose: { initializeOmittedChild },
  EffectsLayer: Layer.empty,
})

it('runs a completed exposed operation in its registered child graph', () => {
  expect(() => initializeOmittedChild(initialModel)).toThrow(
    'Initializing child Binding "omitted-child" requires its registered Composition.',
  )

  const initialized = OmittedParent.expose.initializeOmittedChild(initialModel)

  expect(initialized.model.primary.count).toBe(0)
})

const readAllWrongPlacement = vi.fn((model: ParentModel) => [model.primary])
const readWrongPlacement = vi.fn((child: ChildModel) => child)
const writeWrongPlacement = vi.fn((model: ParentModel, nextChild: ChildModel) =>
  modifyFields(model, { primary: () => nextChild }),
)
const exactParentBase = define('OperationGraphExactParent').define({
  Model: ParentModel,
  Message,
})
const RegisteredPlacementBinding = exactParentBase.bindChild(ChildBlock, {
  fromParentMessage: false,
  placement: 'same-placement',
  readAll: (model: ParentModel) => [model.primary],
  key: () => 'only',
  read: (child: ChildModel) => child,
  writeAt: (model, _key, nextChild) =>
    modifyFields(model, { primary: () => nextChild }),
  toParentMessage: (_key, message: Message) => message,
})
const WrongPlacementBinding = exactParentBase.bindChild(ChildBlock, {
  fromParentMessage: false,
  placement: 'same-placement',
  readAll: readAllWrongPlacement,
  key: () => 'only',
  read: readWrongPlacement,
  writeAt: (model, _key, nextChild) => writeWrongPlacement(model, nextChild),
  toParentMessage: (_key, message: Message) => message,
})

const exactParentComposition = exactParentBase.toComposition({
  childBindings: [RegisteredPlacementBinding],
})
const initializeWrongPlacement = exactParentBase.step(model =>
  WrongPlacementBinding.init({
    key: 'only',
    args: [],
    toParentModel: child => modifyFields(model, { primary: () => child }),
  }),
)
const ExactParent = exactParentComposition.toBlock({
  view: exactParentComposition.view((_model, h) => h.div([])),
  init: () => ({ model: initialModel }),
  update: (model, message) =>
    WrongPlacementBinding.fold(model, 'only', message),
  expose: { initializeWrongPlacement },
  EffectsLayer: Layer.empty,
})

it('checks exact binding identity before reading or writing the parent Model', () => {
  const lowered = lowerBlock(ExactParent)

  expect(() => lowered.update(initialModel, Message.Advanced())).toThrow(
    'The child binding at placement "same-placement" is not registered in the current Block graph.',
  )
  expect(readAllWrongPlacement).not.toHaveBeenCalled()
  expect(readWrongPlacement).not.toHaveBeenCalled()
  expect(writeWrongPlacement).not.toHaveBeenCalled()
})

it('keeps foreign Bindings out of completed exposed operations', () => {
  expect(() =>
    ExactParent.expose.initializeWrongPlacement(initialModel),
  ).toThrow(
    'The child binding at placement "same-placement" is not registered in the current Block graph.',
  )
})

const PolicyOutMessage = defineMessageUnion({ RequestedSiblingReset: {} })
type PolicyOutMessage = typeof PolicyOutMessage.Type

const PolicyOwner = define('OperationGraphPolicyChild')
const policy = PolicyOwner.define({
  Model: ChildModel,
  Message,
  OutMessage: PolicyOutMessage,
})
const policyComposition = policy.toComposition()
const PolicyChild = policyComposition.toBlock({
  view: policyComposition.view((_model, h) => h.div([])),
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: model => ({
    model,
    outMessage: PolicyOutMessage.RequestedSiblingReset(),
  }),
  EffectsLayer: Layer.empty,
})

const policyParentBase = define('OperationGraphPolicyParent').define({
  Model: ParentModel,
  Message,
})
const SiblingChildBinding = policyParentBase.bindChild(ChildBlock, {
  fromParentMessage: false,
  placement: 'sibling-child',
  read: (model: ParentModel) => Option.some(model.sibling),
  write: (model, nextChild) =>
    modifyFields(model, { sibling: () => nextChild }),
  toParentMessage: (message: Message) => message,
})
const PolicyChildBinding = policyParentBase.bindChild(PolicyChild, {
  fromParentMessage: false,
  placement: 'policy-child',
  read: (model: ParentModel) => Option.some(model.primary),
  write: (model, nextChild) =>
    modifyFields(model, { primary: () => nextChild }),
  toParentMessage: (message: Message) => message,
  outMessage: {
    fold: (_outMessage: PolicyOutMessage) => SiblingChildBinding.reset(),
  },
})

const policyParentComposition = policyParentBase.toComposition({
  childBindings: [PolicyChildBinding, SiblingChildBinding],
})
const PolicyParent = policyParentComposition.toBlock({
  view: policyParentComposition.view((_model, h) => h.div([])),
  init: () => ({ model: initialModel }),
  update: (model, message) => PolicyChildBinding.fold(model, message),
  EffectsLayer: Layer.empty,
})

it('restores the parent graph before folding a child OutMessage', () => {
  const lowered = lowerBlock(PolicyParent)

  const result = lowered.update(initialModel, Message.Advanced())

  expect(result.model.sibling.count).toBe(0)
})
