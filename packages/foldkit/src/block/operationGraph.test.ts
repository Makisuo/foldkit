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
const ChildBlock = Child.toComposition().toBlock({
  view: Child.view((_model, h) => h.div([])),
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: Child.update(model => ({
    model: modifyFields(model, { count: count => count + 1 }),
  })),
  expose: { reset },
  EffectsLayer: Layer.empty,
})

const omittedParent = define('OperationGraphOmittedParent').define({
  Model: ParentModel,
  Message,
})
const omittedChild = omittedParent.bindChild(ChildBlock, {
  placement: 'omitted-child',
  read: (model: ParentModel) => Option.some(model.primary),
  write: (model, nextChild) =>
    modifyFields(model, { primary: () => nextChild }),
  toParentMessage: (message: Message) => message,
})

const OmittedParent = omittedParent.toComposition().toBlock({
  view: omittedParent.view((_model, h) => h.div([])),
  init: () => ({
    model: modifyFields(initialModel, {
      primary: () => omittedChild.init().model,
    }),
  }),
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})

it('rejects an omitted pure child after Model-only init extraction', () => {
  const lowered = lowerBlock(OmittedParent)

  expect(() => lowered.init()).toThrow(
    'The child binding at placement "omitted-child" is not registered in the current Block graph.',
  )
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
const registeredPlacement = exactParentBase.bindChild(ChildBlock, {
  placement: 'same-placement',
  readAll: (model: ParentModel) => [model.primary],
  key: () => 'only',
  read: (child: ChildModel) => child,
  writeAt: (model, _key, nextChild) =>
    modifyFields(model, { primary: () => nextChild }),
  toParentMessage: (_key, message: Message) => message,
})
const wrongPlacement = exactParentBase.bindChild(ChildBlock, {
  placement: 'same-placement',
  readAll: readAllWrongPlacement,
  key: () => 'only',
  read: readWrongPlacement,
  writeAt: (model, _key, nextChild) => writeWrongPlacement(model, nextChild),
  toParentMessage: (_key, message: Message) => message,
})

const exactParentComposition = exactParentBase.toComposition({
  children: [registeredPlacement],
})
const ExactParent = exactParentComposition.toBlock({
  view: exactParentComposition.view((_model, h) => h.div([])),
  init: () => ({ model: initialModel }),
  update: (model, message) => wrongPlacement.fold(model, 'only', message),
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

const PolicyOutMessage = defineMessageUnion({ RequestedSiblingReset: {} })
type PolicyOutMessage = typeof PolicyOutMessage.Type

const PolicyOwner = define('OperationGraphPolicyChild')
const policy = PolicyOwner.define({
  Model: ChildModel,
  Message,
  OutMessage: PolicyOutMessage,
})
const PolicyChild = policy.toComposition().toBlock({
  view: policy.view((_model, h) => h.div([])),
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
const siblingChild = policyParentBase.bindChild(ChildBlock, {
  placement: 'sibling-child',
  read: (model: ParentModel) => Option.some(model.sibling),
  write: (model, nextChild) =>
    modifyFields(model, { sibling: () => nextChild }),
  toParentMessage: (message: Message) => message,
})
const policyChild = policyParentBase.bindChild(PolicyChild, {
  placement: 'policy-child',
  read: (model: ParentModel) => Option.some(model.primary),
  write: (model, nextChild) =>
    modifyFields(model, { primary: () => nextChild }),
  toParentMessage: (message: Message) => message,
  outMessage: {
    fold: (_outMessage: PolicyOutMessage) => siblingChild.reset(),
  },
})

const policyParentComposition = policyParentBase.toComposition({
  children: [policyChild, siblingChild],
})
const PolicyParent = policyParentComposition.toBlock({
  view: policyParentComposition.view((_model, h) => h.div([])),
  init: () => ({ model: initialModel }),
  update: (model, message) => policyChild.fold(model, message),
  EffectsLayer: Layer.empty,
})

it('restores the parent graph before folding a child OutMessage', () => {
  const lowered = lowerBlock(PolicyParent)

  const result = lowered.update(initialModel, Message.Advanced())

  expect(result.model.sibling.count).toBe(0)
})
