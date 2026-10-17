import { Layer, Option, Schema } from 'effect'
import { Block, Message, Update } from 'foldkit'

import {
  ArrayChildBlock,
  ChildBlock,
  DeclarationKeyedFieldParentDefinition,
  ParentMessage,
} from './keyed-field-binding.accepted.js'

const entriesField = 'entries'
const wrappedRowsField = 'wrappedRows'
const missingField = 'missing'
const idKey = 'id'
const missingKey = 'missing'
const toEntryMessage = (id: string, message: typeof ChildBlock.Message.Type) =>
  ParentMessage.GotEntryMessage({ id, message })
const fromEntryMessage = {
  parentMessage: ParentMessage.GotEntryMessage,
  args: (
    _model: unknown,
    { id, message }: typeof ParentMessage.GotEntryMessage.Type,
  ): Option.Option<readonly [string, typeof ChildBlock.Message.Type]> =>
    Option.some([id, message]),
}

const wrongModelConfig = {
  field: wrappedRowsField,
  key: idKey,
  toParentMessage: toEntryMessage,
  fromParentMessage: fromEntryMessage,
}
// @ts-expect-error The selected field must be an exact child Model array.
DeclarationKeyedFieldParentDefinition.bindChild(ChildBlock, wrongModelConfig)

const missingFieldConfig = {
  field: missingField,
  key: idKey,
  toParentMessage: toEntryMessage,
  fromParentMessage: fromEntryMessage,
}
// @ts-expect-error The selected field must name a parent Struct field.
DeclarationKeyedFieldParentDefinition.bindChild(ChildBlock, missingFieldConfig)

const missingKeyConfig = {
  field: entriesField,
  key: missingKey,
  toParentMessage: toEntryMessage,
  fromParentMessage: fromEntryMessage,
}
// @ts-expect-error The key must name a field on the child Model.
DeclarationKeyedFieldParentDefinition.bindChild(ChildBlock, missingKeyConfig)

const omittedKeyConfig = {
  field: entriesField,
  toParentMessage: toEntryMessage,
  fromParentMessage: fromEntryMessage,
}
// @ts-expect-error A direct keyed Binding requires a child key field.
DeclarationKeyedFieldParentDefinition.bindChild(ChildBlock, omittedKeyConfig)

const conflictingReadAllConfig = {
  field: entriesField,
  key: idKey,
  readAll: (model: typeof DeclarationKeyedFieldParentDefinition.Model.Type) =>
    model.entries,
  toParentMessage: toEntryMessage,
  fromParentMessage: fromEntryMessage,
}
DeclarationKeyedFieldParentDefinition.bindChild(
  ChildBlock,
  // @ts-expect-error A direct keyed Binding cannot supply collection accessors.
  conflictingReadAllConfig,
)

const conflictingPresenceConfig = {
  field: entriesField,
  key: idKey,
  presentWhen: () => true,
  toParentMessage: toEntryMessage,
  fromParentMessage: fromEntryMessage,
}
DeclarationKeyedFieldParentDefinition.bindChild(
  ChildBlock,
  // @ts-expect-error presentWhen belongs to a static direct Binding.
  conflictingPresenceConfig,
)

const conflictingWriteConfig = {
  field: entriesField,
  key: idKey,
  write: (model: typeof DeclarationKeyedFieldParentDefinition.Model.Type) =>
    model,
  toParentMessage: toEntryMessage,
  fromParentMessage: fromEntryMessage,
}
DeclarationKeyedFieldParentDefinition.bindChild(
  ChildBlock,
  // @ts-expect-error A direct keyed Binding cannot supply a custom write adapter.
  conflictingWriteConfig,
)

const parentMessageConfig = {
  field: entriesField,
  key: idKey,
  parentMessage: ParentMessage.GotEntryMessage,
}
// @ts-expect-error Keyed Bindings require an explicit key-aware mapper.
DeclarationKeyedFieldParentDefinition.bindChild(ChildBlock, parentMessageConfig)

const unexpectedOutMessageConfig = {
  field: entriesField,
  key: idKey,
  toParentMessage: toEntryMessage,
  fromParentMessage: fromEntryMessage,
  outMessage: { fold: () => undefined },
}
// @ts-expect-error A child without OutMessages cannot configure an OutMessage policy.
DeclarationKeyedFieldParentDefinition.bindChild(
  ChildBlock,
  unexpectedOutMessageConfig,
)

const foreignMappingConfig = {
  field: entriesField,
  key: idKey,
  toParentMessage: () => ({ _tag: 'ForeignMessage' }),
  fromParentMessage: fromEntryMessage,
}
DeclarationKeyedFieldParentDefinition.bindChild(
  ChildBlock,
  // @ts-expect-error A keyed mapper must return the established parent Message.
  foreignMappingConfig,
)

DeclarationKeyedFieldParentDefinition.bindChild(ChildBlock, {
  // @ts-expect-error Keyed init must store the initialized child Model directly.
  field: 'entries',
  // @ts-expect-error Keyed init must store the initialized child Model directly.
  key: 'id',
  // @ts-expect-error Keyed init must store the initialized child Model directly.
  toParentMessage: toEntryMessage,
  // @ts-expect-error Keyed init must store the initialized child Model directly.
  fromParentMessage: fromEntryMessage,
  // @ts-expect-error Keyed init must store the initialized child Model directly.
  init: {
    occurrences: () => [{ key: 'initial', args: [] }],
    toItem: (_occurrence, child) => ({ child }),
  },
})

const BooleanKeyModel = Schema.Struct({
  id: Schema.Boolean,
  count: Schema.Number,
})
const BooleanKeyMessage = Message.defineMessageUnion({ UpdatedCount: {} })
const DeclarationBooleanKeyChildDefinition = Block.define(
  'DeclarationBooleanKeyChild',
  {
    Model: BooleanKeyModel,
    Message: BooleanKeyMessage,
  },
)
const DeclarationBooleanKeyChildComposition =
  DeclarationBooleanKeyChildDefinition.makeComposition()
const BooleanKeyBlock = DeclarationBooleanKeyChildComposition.makeBlock({
  init: DeclarationBooleanKeyChildComposition.makeInit(() => ({
    model: BooleanKeyModel.make({ id: false, count: 0 }),
  })),
  update: DeclarationBooleanKeyChildComposition.makeUpdate(model => ({
    model,
  })),
  EffectsLayer: Layer.empty,
})
const BooleanKeyParentModel = Schema.Struct({
  entries: Schema.Array(BooleanKeyModel),
})
const BooleanKeyParentMessage = Message.defineMessageUnion({
  GotChildMessage: { id: Schema.Boolean, message: BooleanKeyBlock.Message },
})
const DeclarationBooleanKeyParentDefinition = Block.define(
  'DeclarationBooleanKeyParent',
  {
    Model: BooleanKeyParentModel,
    Message: BooleanKeyParentMessage,
  },
)
const booleanKeyConfig = {
  field: entriesField,
  key: idKey,
  toParentMessage: (id: boolean, message: typeof BooleanKeyMessage.Type) =>
    BooleanKeyParentMessage.GotChildMessage({ id, message }),
  fromParentMessage: {
    parentMessage: BooleanKeyParentMessage.GotChildMessage,
    args: (
      _model: unknown,
      { id, message }: typeof BooleanKeyParentMessage.GotChildMessage.Type,
    ): Option.Option<readonly [boolean, typeof BooleanKeyMessage.Type]> =>
      Option.some([id, message]),
  },
}
DeclarationBooleanKeyParentDefinition.bindChild(
  BooleanKeyBlock,
  // @ts-expect-error Child occurrence keys must be strings or numbers.
  booleanKeyConfig,
)

const OptionalKeyModel = Schema.Struct({
  id: Schema.optionalKey(Schema.String),
  count: Schema.Number,
})
const OptionalKeyMessage = Message.defineMessageUnion({ UpdatedCount: {} })
const DeclarationOptionalKeyChildDefinition = Block.define(
  'DeclarationOptionalKeyChild',
  {
    Model: OptionalKeyModel,
    Message: OptionalKeyMessage,
  },
)
const DeclarationOptionalKeyChildComposition =
  DeclarationOptionalKeyChildDefinition.makeComposition()
const OptionalKeyBlock = DeclarationOptionalKeyChildComposition.makeBlock({
  init: DeclarationOptionalKeyChildComposition.makeInit(() => ({
    model: OptionalKeyModel.make({ count: 0 }),
  })),
  update: DeclarationOptionalKeyChildComposition.makeUpdate(model => ({
    model,
  })),
  EffectsLayer: Layer.empty,
})
const OptionalKeyParentModel = Schema.Struct({
  entries: Schema.Array(OptionalKeyModel),
})
const OptionalKeyParentMessage = Message.defineMessageUnion({
  GotChildMessage: { id: Schema.String, message: OptionalKeyBlock.Message },
})
const DeclarationOptionalKeyParentDefinition = Block.define(
  'DeclarationOptionalKeyParent',
  {
    Model: OptionalKeyParentModel,
    Message: OptionalKeyParentMessage,
  },
)
const optionalKeyConfig = {
  field: entriesField,
  key: idKey,
  toParentMessage: (id: string, message: typeof OptionalKeyMessage.Type) =>
    OptionalKeyParentMessage.GotChildMessage({ id, message }),
  fromParentMessage: {
    parentMessage: OptionalKeyParentMessage.GotChildMessage,
    args: (
      _model: unknown,
      { id, message }: typeof OptionalKeyParentMessage.GotChildMessage.Type,
    ): Option.Option<readonly [string, typeof OptionalKeyMessage.Type]> =>
      Option.some([id, message]),
  },
}
DeclarationOptionalKeyParentDefinition.bindChild(
  OptionalKeyBlock,
  // @ts-expect-error A child key field must be required.
  optionalKeyConfig,
)

const ExtendedChildModel = Schema.Struct({
  id: Schema.String,
  count: Schema.Number,
  note: Schema.optionalKey(Schema.String),
})
const ExtendedParentModel = Schema.Struct({
  entries: Schema.Array(ExtendedChildModel),
})
const DeclarationExtendedKeyParentDefinition = Block.define(
  'DeclarationExtendedKeyParent',
  {
    Model: ExtendedParentModel,
    Message: ParentMessage,
  },
)
const extendedFieldConfig = {
  field: entriesField,
  key: idKey,
  toParentMessage: toEntryMessage,
  fromParentMessage: fromEntryMessage,
}
DeclarationExtendedKeyParentDefinition.bindChild(
  ChildBlock,
  // @ts-expect-error The field element cannot have extra optional properties.
  extendedFieldConfig,
)

const PrimitiveMessage = Message.defineMessageUnion({ UpdatedValue: {} })
const DeclarationPrimitiveKeyChildDefinition = Block.define(
  'DeclarationPrimitiveKeyChild',
  {
    Model: Schema.String,
    Message: PrimitiveMessage,
  },
)
const DeclarationPrimitiveKeyChildComposition =
  DeclarationPrimitiveKeyChildDefinition.makeComposition()
const PrimitiveBlock = DeclarationPrimitiveKeyChildComposition.makeBlock({
  init: DeclarationPrimitiveKeyChildComposition.makeInit(() => ({
    model: 'initial',
  })),
  update: DeclarationPrimitiveKeyChildComposition.makeUpdate(model => ({
    model,
  })),
  EffectsLayer: Layer.empty,
})
const PrimitiveParentModel = Schema.Struct({
  entries: Schema.Array(Schema.String),
})
const PrimitiveParentMessage = Message.defineMessageUnion({
  GotChildMessage: { id: Schema.Number, message: PrimitiveBlock.Message },
})
const DeclarationPrimitiveKeyParentDefinition = Block.define(
  'DeclarationPrimitiveKeyParent',
  {
    Model: PrimitiveParentModel,
    Message: PrimitiveParentMessage,
  },
)
const primitiveKeyConfig = {
  field: entriesField,
  key: 'length',
  toParentMessage: (id: number, message: typeof PrimitiveMessage.Type) =>
    PrimitiveParentMessage.GotChildMessage({ id, message }),
  fromParentMessage: {
    parentMessage: PrimitiveParentMessage.GotChildMessage,
    args: (
      _model: unknown,
      { id, message }: typeof PrimitiveParentMessage.GotChildMessage.Type,
    ): Option.Option<readonly [number, typeof PrimitiveMessage.Type]> =>
      Option.some([id, message]),
  },
}
DeclarationPrimitiveKeyParentDefinition.bindChild(
  PrimitiveBlock,
  // @ts-expect-error A keyed child Model must be an object Struct.
  primitiveKeyConfig,
)

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
const DeclarationUnionKeyChildDefinition = Block.define(
  'DeclarationUnionKeyChild',
  {
    Model: UnionKeyModel,
    Message: UnionKeyMessage,
  },
)
const DeclarationUnionKeyChildComposition =
  DeclarationUnionKeyChildDefinition.makeComposition()
const UnionKeyBlock = DeclarationUnionKeyChildComposition.makeBlock({
  init: DeclarationUnionKeyChildComposition.makeInit(() => ({
    model: UnionKeyModel.make({
      _tag: 'Primary',
      id: 'initial',
      count: 0,
    }),
  })),
  update: DeclarationUnionKeyChildComposition.makeUpdate(model => ({ model })),
  EffectsLayer: Layer.empty,
})
const UnionKeyParentModel = Schema.Struct({
  entries: Schema.Array(UnionKeyModel),
})
const UnionKeyParentMessage = Message.defineMessageUnion({
  GotChildMessage: { id: Schema.String, message: UnionKeyBlock.Message },
})
const DeclarationUnionKeyParentDefinition = Block.define(
  'DeclarationUnionKeyParent',
  {
    Model: UnionKeyParentModel,
    Message: UnionKeyParentMessage,
  },
)
const unionKeyConfig = {
  field: entriesField,
  key: idKey,
  toParentMessage: (id: string, message: typeof UnionKeyMessage.Type) =>
    UnionKeyParentMessage.GotChildMessage({ id, message }),
  fromParentMessage: {
    parentMessage: UnionKeyParentMessage.GotChildMessage,
    args: (
      _model: unknown,
      { id, message }: typeof UnionKeyParentMessage.GotChildMessage.Type,
    ): Option.Option<readonly [string, typeof UnionKeyMessage.Type]> =>
      Option.some([id, message]),
  },
}
// @ts-expect-error Direct keyed shorthand requires a Struct child Model schema.
DeclarationUnionKeyParentDefinition.bindChild(UnionKeyBlock, unionKeyConfig)

const ArrayCollectionParentModel = Schema.Struct({
  entries: Schema.Array(ArrayChildBlock.Model),
})
const DeclarationArrayCollectionParentDefinition = Block.define(
  'DeclarationArrayCollectionParent',
  {
    Model: ArrayCollectionParentModel,
    Message: ParentMessage,
  },
)
const arrayModelKeyConfig = {
  field: entriesField,
  key: 'length',
  toParentMessage: (
    _length: number,
    message: typeof ArrayChildBlock.Message.Type,
  ) => ParentMessage.GotArrayChildMessage({ message }),
  fromParentMessage: {
    parentMessage: ParentMessage.GotArrayChildMessage,
    args: () => Option.none(),
  },
}
DeclarationArrayCollectionParentDefinition.bindChild(
  ArrayChildBlock,
  // @ts-expect-error An Array child Model has no Struct key fields.
  arrayModelKeyConfig,
)

const InvalidKeyModel = Schema.Struct({
  nullKey: Schema.Null,
  unknownKey: Schema.Unknown,
  neverKey: Schema.Never,
  anyKey: Schema.Any,
})
const InvalidKeyMessage = Message.defineMessageUnion({ UpdatedValue: {} })
const DeclarationInvalidKeyChildDefinition = Block.define(
  'DeclarationInvalidKeyChild',
  {
    Model: InvalidKeyModel,
    Message: InvalidKeyMessage,
  },
)
const DeclarationInvalidKeyChildComposition =
  DeclarationInvalidKeyChildDefinition.makeComposition()
const InvalidKeyBlock = DeclarationInvalidKeyChildComposition.makeBlock({
  init: DeclarationInvalidKeyChildComposition.makeInit(
    (): Update.Return<
      typeof InvalidKeyModel.Type,
      typeof InvalidKeyMessage.Type
    > => {
      throw new Error('Uninhabited declaration fixture')
    },
  ),
  update: DeclarationInvalidKeyChildComposition.makeUpdate(model => ({
    model,
  })),
  EffectsLayer: Layer.empty,
})
const InvalidKeyParentModel = Schema.Struct({
  entries: Schema.Array(InvalidKeyModel),
})
const InvalidKeyParentMessage = Message.defineMessageUnion({
  GotChildMessage: { message: InvalidKeyBlock.Message },
})
const DeclarationInvalidKeyParentDefinition = Block.define(
  'DeclarationInvalidKeyParent',
  {
    Model: InvalidKeyParentModel,
    Message: InvalidKeyParentMessage,
  },
)
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
  fromParentMessage: {
    parentMessage: InvalidKeyParentMessage.GotChildMessage,
    args: () => Option.none(),
  },
}
const unknownKeyConfig = {
  field: entriesField,
  key: unknownKey,
  toParentMessage: toInvalidKeyMessage,
  fromParentMessage: {
    parentMessage: InvalidKeyParentMessage.GotChildMessage,
    args: () => Option.none(),
  },
}
const neverKeyConfig = {
  field: entriesField,
  key: neverKey,
  toParentMessage: toInvalidKeyMessage,
  fromParentMessage: {
    parentMessage: InvalidKeyParentMessage.GotChildMessage,
    args: () => Option.none(),
  },
}
const anyKeyConfig = {
  field: entriesField,
  key: anyKey,
  toParentMessage: toInvalidKeyMessage,
  fromParentMessage: {
    parentMessage: InvalidKeyParentMessage.GotChildMessage,
    args: () => Option.none(),
  },
}

// @ts-expect-error Null is not an occurrence key type.
DeclarationInvalidKeyParentDefinition.bindChild(InvalidKeyBlock, nullKeyConfig)
DeclarationInvalidKeyParentDefinition.bindChild(
  InvalidKeyBlock,
  // @ts-expect-error Unknown is not an occurrence key type.
  unknownKeyConfig,
)
// @ts-expect-error Never is not an occurrence key type.
DeclarationInvalidKeyParentDefinition.bindChild(InvalidKeyBlock, neverKeyConfig)
// @ts-expect-error Any is not an occurrence key type.
DeclarationInvalidKeyParentDefinition.bindChild(InvalidKeyBlock, anyKeyConfig)

const repeatedModelConfig: Readonly<{
  field: 'entries'
  key: 'id'
  Model: typeof Schema.String
  toParentMessage: typeof toEntryMessage
  fromParentMessage: Readonly<{
    parentMessage: typeof ParentMessage.GotEntryMessage
    args: (
      model: typeof DeclarationKeyedFieldParentDefinition.Model.Type,
      message: typeof ParentMessage.GotEntryMessage.Type,
    ) => Option.Option<readonly [string, typeof ChildBlock.Message.Type]>
  }>
}> = {
  field: entriesField,
  key: idKey,
  Model: Schema.String,
  toParentMessage: toEntryMessage,
  fromParentMessage: fromEntryMessage,
}
// @ts-expect-error Assigned configs cannot override the owning Definition's Model.
DeclarationKeyedFieldParentDefinition.bindChild(ChildBlock, repeatedModelConfig)
