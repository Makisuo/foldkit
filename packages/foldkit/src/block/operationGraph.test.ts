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
const childDefinition = ChildOwner.define({ Model: ChildModel, Message })
const reset = childDefinition.step((_model: ChildModel) => ({
  model: ChildModel.make({ count: 0 }),
}))
const Child = childDefinition.assemble({
  view: childDefinition.view((_model, h) => h.div([])),
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: childDefinition.update(model => ({
    model: modifyFields(model, { count: count => count + 1 }),
  })),
  steps: { reset },
  EffectsLayer: Layer.empty,
})

const omittedChild = Child.connection({
  placement: 'omitted-child',
  read: (model: ParentModel) => Option.some(model.primary),
  write: (model, nextChild) =>
    modifyFields(model, { primary: () => nextChild }),
  toParentMessage: (message: Message) => message,
})

const omittedParentDefinition = define('OperationGraphOmittedParent').define({
  Model: ParentModel,
  Message,
})
const OmittedParent = omittedParentDefinition.assemble({
  view: omittedParentDefinition.view((_model, h) => h.div([])),
  init: () => ({
    model: modifyFields(initialModel, {
      primary: () => omittedChild.init().model,
    }),
  }),
  update: (model: ParentModel) => ({ model }),
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
const registeredPlacement = Child.keyedConnection({
  placement: 'same-placement',
  readAll: (model: ParentModel) => [model.primary],
  key: () => 'only',
  read: (child: ChildModel) => child,
  writeAt: (model, _key, nextChild) =>
    modifyFields(model, { primary: () => nextChild }),
  toParentMessage: (_key, message: Message) => message,
})
const wrongPlacement = Child.keyedConnection({
  placement: 'same-placement',
  readAll: readAllWrongPlacement,
  key: () => 'only',
  read: readWrongPlacement,
  writeAt: (model, _key, nextChild) => writeWrongPlacement(model, nextChild),
  toParentMessage: (_key, message: Message) => message,
})

const exactParentBase = define('OperationGraphExactParent').define({
  Model: ParentModel,
  Message,
})
const exactParentDefinition = exactParentBase.register({
  children: [registeredPlacement],
})
const ExactParent = exactParentDefinition.assemble({
  view: exactParentDefinition.view((_model, h) => h.div([])),
  init: () => ({ model: initialModel }),
  update: (model: ParentModel, message: Message) =>
    wrongPlacement.fold(model, 'only', message),
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
const policyDefinition = PolicyOwner.define({
  Model: ChildModel,
  Message,
  OutMessage: PolicyOutMessage,
})
const PolicyChild = policyDefinition.assemble({
  view: policyDefinition.view((_model, h) => h.div([])),
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: (model: ChildModel) => ({
    model,
    outMessage: PolicyOutMessage.RequestedSiblingReset(),
  }),
  EffectsLayer: Layer.empty,
})

const siblingChild = Child.connection({
  placement: 'sibling-child',
  read: (model: ParentModel) => Option.some(model.sibling),
  write: (model, nextChild) =>
    modifyFields(model, { sibling: () => nextChild }),
  toParentMessage: (message: Message) => message,
})
const policyChild = PolicyChild.connection({
  placement: 'policy-child',
  read: (model: ParentModel) => Option.some(model.primary),
  write: (model, nextChild) =>
    modifyFields(model, { primary: () => nextChild }),
  toParentMessage: (message: Message) => message,
  outMessage: {
    fold: (_outMessage: PolicyOutMessage) => siblingChild.reset(),
  },
})

const policyParentBase = define('OperationGraphPolicyParent').define({
  Model: ParentModel,
  Message,
})
const policyParentDefinition = policyParentBase.register({
  children: [policyChild, siblingChild],
})
const PolicyParent = policyParentDefinition.assemble({
  view: policyParentDefinition.view((_model, h) => h.div([])),
  init: () => ({ model: initialModel }),
  update: (model: ParentModel, message: Message) =>
    policyChild.fold(model, message),
  EffectsLayer: Layer.empty,
})

it('restores the parent graph before folding a child OutMessage', () => {
  const lowered = lowerBlock(PolicyParent)

  const result = lowered.update(initialModel, Message.Advanced())

  expect(result.model.sibling.count).toBe(0)
})
