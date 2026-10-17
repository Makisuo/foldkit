import { Layer, Schema } from 'effect'
import * as Block from 'foldkit/block'
import { defineMessageUnion } from 'foldkit/message'

import {
  ChildBlock,
  Choice,
  EntryBinding,
  Message,
  Model,
  OperationConstructorProofChildComposition,
  OperationConstructorProofChildDefinition,
  OperationConstructorProofParentComposition,
  OperationConstructorProofParentDefinition,
  ParentMessage,
  RecordValue,
  update,
  updateValue,
} from './operation-constructor.accepted.js'

const model = Model.make({ value: '' })

// @ts-expect-error An operation descriptor is passive until makeBlock completes it.
updateValue(model, { value: 'next' }, { prefix: 'invalid' })

// @ts-expect-error An empty constructor operation takes no payload argument.
ChildBlock.operations.resetValue(model, {}, { prefix: 'invalid' })

// @ts-expect-error A nonempty constructor operation requires one payload object.
ChildBlock.operations.updateValue(model, { prefix: 'invalid' })

ChildBlock.operations.updateValue(
  model,
  // @ts-expect-error Constructor payload fields retain their exact input types.
  { value: 1 },
  { prefix: 'invalid' },
)

ChildBlock.operations.updateValue(
  model,
  { value: 'next' },
  // @ts-expect-error Required update Context follows the constructor payload.
  { source: 'invalid' },
)

ChildBlock.operations.updateValue(
  model,
  { value: 'next' },
  { prefix: 'invalid' },
  undefined,
  // @ts-expect-error Defaulted update Context keeps its declared type.
  1,
)

// @ts-expect-error Keyed Binding operations require the key first.
EntryBinding.updateValue({ value: 'next' }, { prefix: 'invalid' })

EntryBinding.updateValue(
  // @ts-expect-error The keyed Binding retains the exact key type.
  1,
  { value: 'next' },
  { prefix: 'invalid' },
)

Choice.operations.select(
  Choice.Model.make({ selected: 'First' }),
  // @ts-expect-error Generic constructor payloads retain their refinement.
  { value: 'Third' },
)

Choice.operations.selectPositionally(
  Choice.Model.make({ selected: 'First' }),
  // @ts-expect-error Custom positional producers remain refined too.
  'Third',
)

const ForeignMessage = defineMessageUnion({ UpdatedForeignValue: {} })
OperationConstructorProofChildComposition.makeOperation(
  // @ts-expect-error makeOperation accepts only a local Message constructor.
  ForeignMessage.UpdatedForeignValue,
)

const OperationConstructorProofForeignDefinition = Block.define(
  'OperationConstructorProofForeign',
  {
    Model,
    Message,
  },
)
const OperationConstructorProofForeignComposition =
  OperationConstructorProofForeignDefinition.makeComposition()
const foreignUpdateValue =
  OperationConstructorProofForeignComposition.makeOperation(
    Message.UpdatedValue,
  )
// @ts-expect-error A descriptor belongs to the exact Composition owner.
OperationConstructorProofChildComposition.makeBlock({
  init: () => ({ model }),
  update,
  operations: {
    updateValue: foreignUpdateValue,
  },
  EffectsLayer: Layer.empty,
  hostHandlers: [RecordValue],
})

const gotChildMessage =
  OperationConstructorProofParentComposition.makeOperation(
    // @ts-expect-error Got* child wrappers are routed facts, not authored operations.
    ParentMessage.GotChildMessage,
  )
void gotChildMessage

const plainTaggedStruct = Schema.TaggedStruct('UpdatedValue', {
  value: Schema.String,
})
// @ts-expect-error makeOperation requires a Foldkit callable Message constructor.
OperationConstructorProofChildComposition.makeOperation(plainTaggedStruct)

// @ts-expect-error Operation names cannot collide with reserved Block or Binding members.
OperationConstructorProofChildComposition.makeBlock({
  init: () => ({ model }),
  update,
  operations: { fold: updateValue },
  EffectsLayer: Layer.empty,
  hostHandlers: [RecordValue],
})

// @ts-expect-error The completed Block has no legacy expose alias.
ChildBlock.expose

void OperationConstructorProofChildDefinition
void Layer.empty

// @ts-expect-error Operations are declared after the Composition fixes child ownership.
OperationConstructorProofChildDefinition.makeOperation(Message.ResetValue)

// @ts-expect-error A used child wrapper cannot lose its owning Binding registration.
OperationConstructorProofParentDefinition.makeComposition({
  childBindings: [EntryBinding],
})

// oxlint-disable-next-line typescript/no-explicit-any -- Deliberately erased input must fail operation validation.
declare const anyConstructor: any
// @ts-expect-error An erased constructor cannot declare a checked operation.
OperationConstructorProofChildComposition.makeOperation(anyConstructor)
