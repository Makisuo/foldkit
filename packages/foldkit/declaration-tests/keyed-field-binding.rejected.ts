import { Layer, Schema } from 'effect'

import { Block, Message } from '../src/index.js'
import {
  ArrayChildBlock,
  ChildBlock,
  Parent,
  ParentMessage,
} from './keyed-field-binding.accepted.js'

const entriesField = 'entries'
const wrappedRowsField = 'wrappedRows'
const missingField = 'missing'
const idKey = 'id'
const missingKey = 'missing'
const toEntryMessage = (id: string, message: typeof ChildBlock.Message.Type) =>
  ParentMessage.GotEntryMessage({ id, message })

const wrongModelConfig = {
  field: wrappedRowsField,
  key: idKey,
  toParentMessage: toEntryMessage,
}
// @ts-expect-error The selected field must be an exact child Model array.
Parent.bindChild(ChildBlock, wrongModelConfig)

const missingFieldConfig = {
  field: missingField,
  key: idKey,
  toParentMessage: toEntryMessage,
}
// @ts-expect-error The selected field must name a parent Struct field.
Parent.bindChild(ChildBlock, missingFieldConfig)

const missingKeyConfig = {
  field: entriesField,
  key: missingKey,
  toParentMessage: toEntryMessage,
}
// @ts-expect-error The key must name a field on the child Model.
Parent.bindChild(ChildBlock, missingKeyConfig)

const omittedKeyConfig = {
  field: entriesField,
  toParentMessage: toEntryMessage,
}
// @ts-expect-error A direct keyed Binding requires a child key field.
Parent.bindChild(ChildBlock, omittedKeyConfig)

const conflictingReadAllConfig = {
  field: entriesField,
  key: idKey,
  readAll: (model: typeof Parent.Model.Type) => model.entries,
  toParentMessage: toEntryMessage,
}
// @ts-expect-error A direct keyed Binding cannot supply collection accessors.
Parent.bindChild(ChildBlock, conflictingReadAllConfig)

const conflictingPresenceConfig = {
  field: entriesField,
  key: idKey,
  presentWhen: () => true,
  toParentMessage: toEntryMessage,
}
// @ts-expect-error presentWhen belongs to a static direct Binding.
Parent.bindChild(ChildBlock, conflictingPresenceConfig)

const conflictingWriteConfig = {
  field: entriesField,
  key: idKey,
  write: (model: typeof Parent.Model.Type) => model,
  toParentMessage: toEntryMessage,
}
// @ts-expect-error A direct keyed Binding cannot supply a custom write adapter.
Parent.bindChild(ChildBlock, conflictingWriteConfig)

const parentMessageConfig = {
  field: entriesField,
  key: idKey,
  parentMessage: ParentMessage.GotEntryMessage,
}
// @ts-expect-error Keyed Bindings require an explicit key-aware mapper.
Parent.bindChild(ChildBlock, parentMessageConfig)

const unexpectedOutMessageConfig = {
  field: entriesField,
  key: idKey,
  toParentMessage: toEntryMessage,
  outMessage: { fold: () => undefined },
}
// @ts-expect-error A child without OutMessages cannot configure an OutMessage policy.
Parent.bindChild(ChildBlock, unexpectedOutMessageConfig)

const foreignMappingConfig = {
  field: entriesField,
  key: idKey,
  toParentMessage: () => ({ _tag: 'ForeignMessage' }),
}
// @ts-expect-error A keyed mapper must return the established parent Message.
Parent.bindChild(ChildBlock, foreignMappingConfig)

const BooleanKeyModel = Schema.Struct({
  id: Schema.Boolean,
  count: Schema.Number,
})
const BooleanKeyMessage = Message.defineMessageUnion({ UpdatedCount: {} })
const BooleanKeyChild = Block.define('DeclarationBooleanKeyChild', {
  Model: BooleanKeyModel,
  Message: BooleanKeyMessage,
})
const BooleanKeyBlock = BooleanKeyChild.toComposition().toBlock({
  init: () => ({ model: BooleanKeyModel.make({ id: false, count: 0 }) }),
  update: BooleanKeyChild.update(model => ({ model })),
  EffectsLayer: Layer.empty,
})
const BooleanKeyParentModel = Schema.Struct({
  entries: Schema.Array(BooleanKeyModel),
})
const BooleanKeyParentMessage = Message.defineMessageUnion({
  GotChildMessage: { id: Schema.Boolean, message: BooleanKeyMessage },
})
const BooleanKeyParent = Block.define('DeclarationBooleanKeyParent', {
  Model: BooleanKeyParentModel,
  Message: BooleanKeyParentMessage,
})
const booleanKeyConfig = {
  field: entriesField,
  key: idKey,
  toParentMessage: (id: boolean, message: typeof BooleanKeyMessage.Type) =>
    BooleanKeyParentMessage.GotChildMessage({ id, message }),
}
// @ts-expect-error Child occurrence keys must be strings or numbers.
BooleanKeyParent.bindChild(BooleanKeyBlock, booleanKeyConfig)

const OptionalKeyModel = Schema.Struct({
  id: Schema.optionalKey(Schema.String),
  count: Schema.Number,
})
const OptionalKeyMessage = Message.defineMessageUnion({ UpdatedCount: {} })
const OptionalKeyChild = Block.define('DeclarationOptionalKeyChild', {
  Model: OptionalKeyModel,
  Message: OptionalKeyMessage,
})
const OptionalKeyBlock = OptionalKeyChild.toComposition().toBlock({
  init: () => ({ model: OptionalKeyModel.make({ count: 0 }) }),
  update: OptionalKeyChild.update(model => ({ model })),
  EffectsLayer: Layer.empty,
})
const OptionalKeyParentModel = Schema.Struct({
  entries: Schema.Array(OptionalKeyModel),
})
const OptionalKeyParentMessage = Message.defineMessageUnion({
  GotChildMessage: { id: Schema.String, message: OptionalKeyMessage },
})
const OptionalKeyParent = Block.define('DeclarationOptionalKeyParent', {
  Model: OptionalKeyParentModel,
  Message: OptionalKeyParentMessage,
})
const optionalKeyConfig = {
  field: entriesField,
  key: idKey,
  toParentMessage: (id: string, message: typeof OptionalKeyMessage.Type) =>
    OptionalKeyParentMessage.GotChildMessage({ id, message }),
}
// @ts-expect-error A child key field must be required.
OptionalKeyParent.bindChild(OptionalKeyBlock, optionalKeyConfig)

const ExtendedChildModel = Schema.Struct({
  id: Schema.String,
  count: Schema.Number,
  note: Schema.optionalKey(Schema.String),
})
const ExtendedParentModel = Schema.Struct({
  entries: Schema.Array(ExtendedChildModel),
})
const ExtendedParent = Block.define('DeclarationExtendedKeyParent', {
  Model: ExtendedParentModel,
  Message: ParentMessage,
})
const extendedFieldConfig = {
  field: entriesField,
  key: idKey,
  toParentMessage: toEntryMessage,
}
// @ts-expect-error The field element cannot have extra optional properties.
ExtendedParent.bindChild(ChildBlock, extendedFieldConfig)

const PrimitiveMessage = Message.defineMessageUnion({ UpdatedValue: {} })
const PrimitiveChild = Block.define('DeclarationPrimitiveKeyChild', {
  Model: Schema.String,
  Message: PrimitiveMessage,
})
const PrimitiveBlock = PrimitiveChild.toComposition().toBlock({
  init: () => ({ model: 'initial' }),
  update: PrimitiveChild.update(model => ({ model })),
  EffectsLayer: Layer.empty,
})
const PrimitiveParentModel = Schema.Struct({
  entries: Schema.Array(Schema.String),
})
const PrimitiveParentMessage = Message.defineMessageUnion({
  GotChildMessage: { id: Schema.Number, message: PrimitiveMessage },
})
const PrimitiveParent = Block.define('DeclarationPrimitiveKeyParent', {
  Model: PrimitiveParentModel,
  Message: PrimitiveParentMessage,
})
const primitiveKeyConfig = {
  field: entriesField,
  key: 'length',
  toParentMessage: (id: number, message: typeof PrimitiveMessage.Type) =>
    PrimitiveParentMessage.GotChildMessage({ id, message }),
}
// @ts-expect-error A keyed child Model must be an object Struct.
PrimitiveParent.bindChild(PrimitiveBlock, primitiveKeyConfig)

const UnionKeyModel = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal('Primary'),
    id: Schema.String,
    count: Schema.Number,
  }),
  Schema.Struct({
    _tag: Schema.Literal('Secondary'),
    id: Schema.String,
    count: Schema.Number,
  }),
])
const UnionKeyMessage = Message.defineMessageUnion({ UpdatedCount: {} })
const UnionKeyChild = Block.define('DeclarationUnionKeyChild', {
  Model: UnionKeyModel,
  Message: UnionKeyMessage,
})
const UnionKeyBlock = UnionKeyChild.toComposition().toBlock({
  init: () => ({
    model: UnionKeyModel.make({
      _tag: 'Primary',
      id: 'initial',
      count: 0,
    }),
  }),
  update: UnionKeyChild.update(model => ({ model })),
  EffectsLayer: Layer.empty,
})
const UnionKeyParentModel = Schema.Struct({
  entries: Schema.Array(UnionKeyModel),
})
const UnionKeyParentMessage = Message.defineMessageUnion({
  GotChildMessage: { id: Schema.String, message: UnionKeyMessage },
})
const UnionKeyParent = Block.define('DeclarationUnionKeyParent', {
  Model: UnionKeyParentModel,
  Message: UnionKeyParentMessage,
})
const unionKeyConfig = {
  field: entriesField,
  key: idKey,
  toParentMessage: (id: string, message: typeof UnionKeyMessage.Type) =>
    UnionKeyParentMessage.GotChildMessage({ id, message }),
}
// @ts-expect-error Direct keyed shorthand requires a Struct child Model schema.
UnionKeyParent.bindChild(UnionKeyBlock, unionKeyConfig)

const ArrayCollectionParentModel = Schema.Struct({
  entries: Schema.Array(ArrayChildBlock.Model),
})
const ArrayCollectionParent = Block.define('DeclarationArrayCollectionParent', {
  Model: ArrayCollectionParentModel,
  Message: ParentMessage,
})
const arrayModelKeyConfig = {
  field: entriesField,
  key: 'length',
  toParentMessage: (
    _length: number,
    message: typeof ArrayChildBlock.Message.Type,
  ) => ParentMessage.GotArrayChildMessage({ message }),
}
// @ts-expect-error An Array child Model has no Struct key fields.
ArrayCollectionParent.bindChild(ArrayChildBlock, arrayModelKeyConfig)

const InvalidKeyModel = Schema.Struct({
  nullKey: Schema.Null,
  unknownKey: Schema.Unknown,
  neverKey: Schema.Never,
  anyKey: Schema.Any,
})
const InvalidKeyMessage = Message.defineMessageUnion({ UpdatedValue: {} })
const InvalidKeyChild = Block.define('DeclarationInvalidKeyChild', {
  Model: InvalidKeyModel,
  Message: InvalidKeyMessage,
})
const InvalidKeyBlock = InvalidKeyChild.toComposition().toBlock({
  init: () => {
    throw new Error('Uninhabited declaration fixture')
  },
  update: InvalidKeyChild.update(model => ({ model })),
  EffectsLayer: Layer.empty,
})
const InvalidKeyParentModel = Schema.Struct({
  entries: Schema.Array(InvalidKeyModel),
})
const InvalidKeyParentMessage = Message.defineMessageUnion({
  GotChildMessage: { message: InvalidKeyMessage },
})
const InvalidKeyParent = Block.define('DeclarationInvalidKeyParent', {
  Model: InvalidKeyParentModel,
  Message: InvalidKeyParentMessage,
})
const toInvalidKeyMessage = (
  _key: unknown,
  message: typeof InvalidKeyMessage.Type,
) => InvalidKeyParentMessage.GotChildMessage({ message })

const nullKey = 'nullKey'
const unknownKey = 'unknownKey'
const neverKey = 'neverKey'
const anyKey = 'anyKey'
const nullKeyConfig = {
  field: entriesField,
  key: nullKey,
  toParentMessage: toInvalidKeyMessage,
}
const unknownKeyConfig = {
  field: entriesField,
  key: unknownKey,
  toParentMessage: toInvalidKeyMessage,
}
const neverKeyConfig = {
  field: entriesField,
  key: neverKey,
  toParentMessage: toInvalidKeyMessage,
}
const anyKeyConfig = {
  field: entriesField,
  key: anyKey,
  toParentMessage: toInvalidKeyMessage,
}

// @ts-expect-error Null is not an occurrence key type.
InvalidKeyParent.bindChild(InvalidKeyBlock, nullKeyConfig)
// @ts-expect-error Unknown is not an occurrence key type.
InvalidKeyParent.bindChild(InvalidKeyBlock, unknownKeyConfig)
// @ts-expect-error Never is not an occurrence key type.
InvalidKeyParent.bindChild(InvalidKeyBlock, neverKeyConfig)
// @ts-expect-error Any is not an occurrence key type.
InvalidKeyParent.bindChild(InvalidKeyBlock, anyKeyConfig)

const repeatedModelConfig: Readonly<{
  field: 'entries'
  key: 'id'
  Model: typeof Schema.String
  toParentMessage: typeof toEntryMessage
}> = {
  field: entriesField,
  key: idKey,
  Model: Schema.String,
  toParentMessage: toEntryMessage,
}
// @ts-expect-error Assigned configs cannot override the owning Definition's Model.
Parent.bindChild(ChildBlock, repeatedModelConfig)
