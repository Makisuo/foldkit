import { Schema } from 'effect'

import { Block, Message } from '../src/index.js'
import {
  Choice,
  ChoiceEntry,
  ChoiceId,
  Parent,
  ParentMessage,
  PlainChoiceBlock,
  TextBlock,
  firstChoiceId,
  toChoiceMessage,
} from './wrapped-keyed-field.accepted.js'

const OpaqueChoiceEntry = Schema.declare(
  (_input): _input is typeof ChoiceEntry.Type => true,
  { expected: 'opaque choice entry' },
)
const PrimaryChoiceEntry = Schema.Struct({
  _tag: Schema.Literal('Primary'),
  id: ChoiceId,
  choice: Choice.block.Model,
})
const SecondaryChoiceEntry = Schema.Struct({
  _tag: Schema.Literal('Secondary'),
  id: ChoiceId,
  choice: Choice.block.Model,
})
const UnionChoiceEntry = Schema.Union([
  PrimaryChoiceEntry,
  SecondaryChoiceEntry,
])
const IndexChoiceEntry = Schema.StructWithRest(
  Schema.Struct({ id: ChoiceId, choice: Choice.block.Model }),
  [Schema.Record(Schema.String, Schema.Unknown)],
)
const OptionalKeyChoiceEntry = Schema.Struct({
  id: Schema.optionalKey(ChoiceId),
  choice: Choice.block.Model,
})
const MissingKeyChoiceEntry = Schema.Struct({
  choice: Choice.block.Model,
})
const BooleanKeyChoiceEntry = Schema.Struct({
  id: Schema.Boolean,
  choice: Choice.block.Model,
})
const OptionalChildChoiceEntry = Schema.Struct({
  id: ChoiceId,
  choice: Schema.optionalKey(Choice.block.Model),
})
const MissingChildChoiceEntry = Schema.Struct({ id: ChoiceId })
const IncompatibleChildChoiceEntry = Schema.Struct({
  id: ChoiceId,
  choice: Schema.String,
})
const WiderChoiceModel = Schema.Struct({ value: Schema.String })
const WiderChildChoiceEntry = Schema.Struct({
  id: ChoiceId,
  choice: WiderChoiceModel,
})
const NarrowerChoiceModel = Schema.Struct({ value: Schema.Literal('One') })
const NarrowerChildChoiceEntry = Schema.Struct({
  id: ChoiceId,
  choice: NarrowerChoiceModel,
})

const InvalidParentModel = Schema.Struct({
  opaqueChoices: Schema.Array(OpaqueChoiceEntry),
  unionChoices: Schema.Array(UnionChoiceEntry),
  indexChoices: Schema.Array(IndexChoiceEntry),
  optionalChoices: Schema.optionalKey(Schema.Array(ChoiceEntry)),
  optionChoices: Schema.Option(Schema.Array(ChoiceEntry)),
  mapChoices: Schema.HashMap(Schema.String, ChoiceEntry),
  tupleChoices: Schema.Tuple([ChoiceEntry]),
  optionalKeyChoices: Schema.Array(OptionalKeyChoiceEntry),
  missingKeyChoices: Schema.Array(MissingKeyChoiceEntry),
  booleanKeyChoices: Schema.Array(BooleanKeyChoiceEntry),
  optionalChildChoices: Schema.Array(OptionalChildChoiceEntry),
  missingChildChoices: Schema.Array(MissingChildChoiceEntry),
  incompatibleChildChoices: Schema.Array(IncompatibleChildChoiceEntry),
  widerChildChoices: Schema.Array(WiderChildChoiceEntry),
  narrowerChildChoices: Schema.Array(NarrowerChildChoiceEntry),
})
const InvalidParent = Block.define(
  'DeclarationInvalidWrappedKeyedFieldParent',
  {
    Model: InvalidParentModel,
    Message: ParentMessage,
  },
)

const toIgnoredChoiceMessage = (
  _id: unknown,
  message: typeof Choice.Message.Type,
) => ParentMessage.GotChoiceMessage({ id: firstChoiceId, message })

const idKey: 'id' = 'id'
const choiceChildField: 'choice' = 'choice'
const opaqueChoicesField: 'opaqueChoices' = 'opaqueChoices'
const unionChoicesField: 'unionChoices' = 'unionChoices'
const indexChoicesField: 'indexChoices' = 'indexChoices'
const optionalChoicesField: 'optionalChoices' = 'optionalChoices'
const optionChoicesField: 'optionChoices' = 'optionChoices'
const mapChoicesField: 'mapChoices' = 'mapChoices'
const tupleChoicesField: 'tupleChoices' = 'tupleChoices'
const missingChoicesField: 'missingChoices' = 'missingChoices'
const optionalKeyChoicesField: 'optionalKeyChoices' = 'optionalKeyChoices'
const missingKeyChoicesField: 'missingKeyChoices' = 'missingKeyChoices'
const booleanKeyChoicesField: 'booleanKeyChoices' = 'booleanKeyChoices'
const optionalChildChoicesField: 'optionalChildChoices' = 'optionalChildChoices'
const missingChildChoicesField: 'missingChildChoices' = 'missingChildChoices'
const incompatibleChildChoicesField: 'incompatibleChildChoices' =
  'incompatibleChildChoices'
const widerChildChoicesField: 'widerChildChoices' = 'widerChildChoices'
const narrowerChildChoicesField: 'narrowerChildChoices' = 'narrowerChildChoices'
const plainChoicesField: 'plainChoices' = 'plainChoices'

const opaqueConfig = {
  field: opaqueChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Wrapped keyed shorthand requires a Struct item schema.
InvalidParent.bindChild(PlainChoiceBlock, opaqueConfig)

const unionConfig = {
  field: unionChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Wrapped keyed shorthand does not accept union item schemas.
InvalidParent.bindChild(PlainChoiceBlock, unionConfig)

const indexConfig = {
  field: indexChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Wrapped keyed shorthand requires a closed Struct item schema.
InvalidParent.bindChild(PlainChoiceBlock, indexConfig)

const optionalCollectionConfig = {
  field: optionalChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error The parent collection field must be required.
InvalidParent.bindChild(PlainChoiceBlock, optionalCollectionConfig)

const optionCollectionConfig = {
  field: optionChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error The parent collection must be an Array, not an Option.
InvalidParent.bindChild(PlainChoiceBlock, optionCollectionConfig)

const mapCollectionConfig = {
  field: mapChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error The parent collection must be an Array, not a HashMap.
InvalidParent.bindChild(PlainChoiceBlock, mapCollectionConfig)

const tupleCollectionConfig = {
  field: tupleChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error The parent collection must be an Array, not a tuple.
InvalidParent.bindChild(PlainChoiceBlock, tupleCollectionConfig)

const missingCollectionConfig = {
  field: missingChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Wrapped keyed shorthand requires an existing parent field.
InvalidParent.bindChild(PlainChoiceBlock, missingCollectionConfig)

const optionalKeyConfig = {
  field: optionalKeyChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toIgnoredChoiceMessage,
}
// @ts-expect-error The wrapper key field must be required.
InvalidParent.bindChild(PlainChoiceBlock, optionalKeyConfig)

const missingKeyConfig = {
  field: missingKeyChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toIgnoredChoiceMessage,
}
// @ts-expect-error The key must name a wrapper field.
InvalidParent.bindChild(PlainChoiceBlock, missingKeyConfig)

const booleanKeyConfig = {
  field: booleanKeyChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toIgnoredChoiceMessage,
}
// @ts-expect-error Wrapper occurrence keys must be strings or numbers.
InvalidParent.bindChild(PlainChoiceBlock, booleanKeyConfig)

const optionalChildConfig = {
  field: optionalChildChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error The wrapper child field must be required.
InvalidParent.bindChild(PlainChoiceBlock, optionalChildConfig)

const missingChildConfig = {
  field: missingChildChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error The child field must name a wrapper field.
InvalidParent.bindChild(PlainChoiceBlock, missingChildConfig)

const incompatibleChildConfig = {
  field: incompatibleChildChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error The wrapper child field must store the exact child Model.
InvalidParent.bindChild(PlainChoiceBlock, incompatibleChildConfig)

const widerChildConfig = {
  field: widerChildChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error A wider wrapper child field is not exact storage.
InvalidParent.bindChild(PlainChoiceBlock, widerChildConfig)

const narrowerChildConfig = {
  field: narrowerChildChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error A narrower wrapper child field cannot store every transition.
InvalidParent.bindChild(PlainChoiceBlock, narrowerChildConfig)

const missingKeySelectorConfig = {
  field: plainChoicesField,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Wrapped keyed shorthand requires a key field.
Parent.bindChild(PlainChoiceBlock, missingKeySelectorConfig)

const missingChildSelectorConfig = {
  field: plainChoicesField,
  key: idKey,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Wrapped keyed shorthand requires a child field.
Parent.bindChild(PlainChoiceBlock, missingChildSelectorConfig)

const selectParentField = (): keyof typeof Parent.Model.Type => 'plainChoices'
const dynamicFieldConfig = {
  field: selectParentField(),
  key: idKey,
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Wrapped keyed shorthand requires one literal parent field.
Parent.bindChild(PlainChoiceBlock, dynamicFieldConfig)

const selectEntryField = (): keyof typeof ChoiceEntry.Type => 'id'
const dynamicKeyConfig = {
  field: plainChoicesField,
  key: selectEntryField(),
  childField: choiceChildField,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Wrapped keyed shorthand requires one literal key field.
Parent.bindChild(PlainChoiceBlock, dynamicKeyConfig)

const dynamicChildConfig = {
  field: plainChoicesField,
  key: idKey,
  childField: selectEntryField(),
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Wrapped keyed shorthand requires one literal child field.
Parent.bindChild(PlainChoiceBlock, dynamicChildConfig)

const readAllConflict = {
  field: plainChoicesField,
  key: idKey,
  childField: choiceChildField,
  readAll: (model: typeof Parent.Model.Type) => model.plainChoices,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Field shorthand cannot also provide readAll.
Parent.bindChild(PlainChoiceBlock, readAllConflict)

const readConflict = {
  field: plainChoicesField,
  key: idKey,
  childField: choiceChildField,
  read: (entry: typeof ChoiceEntry.Type) => entry.choice,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Field shorthand cannot also provide a custom reader.
Parent.bindChild(PlainChoiceBlock, readConflict)

const writeConflict = {
  field: plainChoicesField,
  key: idKey,
  childField: choiceChildField,
  write: (model: typeof Parent.Model.Type) => model,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Field shorthand cannot also provide a static writer.
Parent.bindChild(PlainChoiceBlock, writeConflict)

const writeAtConflict = {
  field: plainChoicesField,
  key: idKey,
  childField: choiceChildField,
  writeAt: (
    model: typeof Parent.Model.Type,
    _id: typeof ChoiceId.Type,
    _nextChoice: typeof Choice.block.Model.Type,
  ) => model,
  toParentMessage: toChoiceMessage,
}
// @ts-expect-error Field shorthand cannot also provide a keyed writer.
Parent.bindChild(PlainChoiceBlock, writeAtConflict)

const WrongChildMessage = Message.defineMessageUnion({ WrongMessage: {} })
const wrongChildMapping = {
  field: plainChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: (
    id: typeof ChoiceId.Type,
    _message: typeof WrongChildMessage.Type,
  ) =>
    ParentMessage.GotChoiceMessage({
      id,
      message: Choice.Message.CompletedRefresh(),
    }),
}
// @ts-expect-error The mapper must accept the bound child's Message type.
Parent.bindChild(PlainChoiceBlock, wrongChildMapping)

const ForeignParentMessage = Message.defineMessageUnion({
  GotChoiceMessage: { message: Choice.Message },
})
const wrongParentMapping = {
  field: plainChoicesField,
  key: idKey,
  childField: choiceChildField,
  toParentMessage: (
    _id: typeof ChoiceId.Type,
    message: typeof Choice.Message.Type,
  ) => ForeignParentMessage.GotChoiceMessage({ message }),
}
// @ts-expect-error The mapper must return the owning parent's Message type.
Parent.bindChild(PlainChoiceBlock, wrongParentMapping)

const SameFieldEntry = Schema.Struct({ value: Schema.String })
const SameFieldParentModel = Schema.Struct({
  values: Schema.Array(SameFieldEntry),
})
const SameFieldParent = Block.define('DeclarationSameWrappedFieldParent', {
  Model: SameFieldParentModel,
  Message: ParentMessage,
})
const valuesField: 'values' = 'values'
const valueField: 'value' = 'value'
const sameFieldConfig = {
  field: valuesField,
  key: valueField,
  childField: valueField,
  toParentMessage: (id: string, message: typeof TextBlock.Message.Type) =>
    ParentMessage.GotTextMessage({ id, message }),
}
// @ts-expect-error The wrapper key and child fields must be different fields.
SameFieldParent.bindChild(TextBlock, sameFieldConfig)
