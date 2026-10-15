import { Option, Schema } from 'effect'
import { Block, Message } from 'foldkit'

import {
  ArrayChildModel,
  ChildMessage,
  ChildModel,
  Model,
  NestedOptionChildModel,
  Parent,
  ParentMessage,
  arrayChildBlock,
  childBlock,
  nestedOptionChildBlock,
} from './direct-field.accepted.js'

// @ts-expect-error Missing parent fields are rejected.
// oxfmt-ignore
Parent.bindChild(childBlock, { field: 'missing', parentMessage: ParentMessage.GotChildMessage })

const InvalidModel = Schema.Struct({
  number: Schema.Number,
  wrongOption: Schema.Option(Schema.String),
  nullable: Schema.NullOr(ChildModel),
  optional: Schema.optionalKey(ChildModel),
  wider: Schema.Struct({ count: Schema.Union([Schema.Number, Schema.String]) }),
  narrower: Schema.Struct({ count: Schema.Literal(1) }),
  extended: Schema.Struct({
    count: Schema.Number,
    extra: Schema.optionalKey(Schema.String),
  }),
  suspendedWrongOption: Schema.suspend(() => Schema.Option(Schema.String)),
  nestedTooDeep: Schema.Option(Schema.Option(NestedOptionChildModel)),
  arrayChildren: Schema.Array(ArrayChildModel),
  wrongArrayChild: Schema.Array(Schema.Number),
})
// eslint-disable-next-line foldkit/block-name-matches-variable
const Invalid = Block.define('DeclaredInvalidFieldParent', {
  Model: InvalidModel,
  Message: ParentMessage,
})
// @ts-expect-error A primitive field cannot store this Child Model.
// oxfmt-ignore
Invalid.bindChild(childBlock, { field: 'number', parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error An Option must contain the exact Child Model.
// oxfmt-ignore
Invalid.bindChild(childBlock, { field: 'wrongOption', parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error Null is not optional-child storage.
// oxfmt-ignore
Invalid.bindChild(childBlock, { field: 'nullable', parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error A missing property is not Option storage.
// oxfmt-ignore
Invalid.bindChild(childBlock, { field: 'optional', parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error Wider child payloads are not exact storage.
// oxfmt-ignore
Invalid.bindChild(childBlock, { field: 'wider', parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error Narrower storage cannot accept every child transition.
// oxfmt-ignore
Invalid.bindChild(childBlock, { field: 'narrower', parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error The child may not discard extra optional fields.
// oxfmt-ignore
Invalid.bindChild(childBlock, { field: 'extended', parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error A suspended Option must still contain the exact Child Model.
// oxfmt-ignore
Invalid.bindChild(childBlock, { field: 'suspendedWrongOption', parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error Optional storage adds exactly one Option around the Child Model.
// oxfmt-ignore
Invalid.bindChild(nestedOptionChildBlock, { field: 'nestedTooDeep', parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error An array of Array child Models is keyed storage and requires a key field.
// oxfmt-ignore
Invalid.bindChild(arrayChildBlock, { field: 'arrayChildren', parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error A static Array child field must have the exact Array element type.
// oxfmt-ignore
Invalid.bindChild(arrayChildBlock, { field: 'wrongArrayChild', parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error Direct storage cannot also provide a custom reader.
// oxfmt-ignore
Parent.bindChild(childBlock, { field: 'maybeChild', read: () => Option.none(), parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error Direct storage cannot also provide a custom writer.
// oxfmt-ignore
Parent.bindChild(childBlock, { field: 'maybeChild', write: model => model, parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error Static direct fields cannot supply keyed adapters.
// oxfmt-ignore
Parent.bindChild(childBlock, { field: 'maybeChild', readAll: () => [], parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error Field selectors cannot coexist with arbitrary accessors.
// oxfmt-ignore
Parent.bindChild(childBlock, { field: 'child', read: model => Option.some(model.child), write: model => model, parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error Custom readers already own child presence.
// oxfmt-ignore
Parent.bindChild(childBlock, { presentWhen: () => true, read: model => Option.some(model.child), write: model => model, parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error Presence predicates use the owning parent Model.
// oxfmt-ignore
Parent.bindChild(childBlock, { field: 'child', presentWhen: (model: { wrong: boolean }) => model.wrong, parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error Presence predicates must return boolean.
// oxfmt-ignore
Parent.bindChild(childBlock, { field: 'child', presentWhen: () => 'Home', parentMessage: ParentMessage.GotChildMessage })
// @ts-expect-error Exactly one Message mapping is accepted.
// oxfmt-ignore
Parent.bindChild(childBlock, { field: 'maybeChild', parentMessage: ParentMessage.GotChildMessage, toParentMessage: message => ParentMessage.GotChildMessage({ message }) })
const Foreign = Message.defineMessageUnion({
  // eslint-disable-next-line foldkit/got-prefix-requires-block-payload
  GotChildMessage: { message: Schema.String },
  // eslint-disable-next-line foldkit/got-prefix-requires-block-payload
  GotExtraMessage: { message: ChildMessage, id: Schema.String },
})
// @ts-expect-error The wrapper constructor must accept exactly this child Message.
// oxfmt-ignore
Parent.bindChild(childBlock, { field: 'maybeChild', parentMessage: Foreign.GotChildMessage })
// @ts-expect-error Constructors requiring extra fields need an explicit mapping.
// oxfmt-ignore
Parent.bindChild(childBlock, { field: 'maybeChild', parentMessage: Foreign.GotExtraMessage })
// @ts-expect-error Custom mappings must return the owning parent Message.
// oxfmt-ignore
Parent.bindChild(childBlock, { field: 'maybeChild', toParentMessage: () => Foreign.GotChildMessage({ message: 'wrong' }) })

// eslint-disable-next-line foldkit/block-name-matches-variable
const ConstructorParent = Block.define('DeclaredConstructorParent', {
  Model,
  Message: ParentMessage,
})
// @ts-expect-error parentMessage must be a generated exact wrapper constructor.
// oxfmt-ignore
ConstructorParent.bindChild(childBlock, { field: 'child', parentMessage: () => ParentMessage.IgnoredChildMessage() })
// @ts-expect-error A broad callable is not a generated exact wrapper constructor.
// oxfmt-ignore
ConstructorParent.bindChild(childBlock, { field: 'child', parentMessage: (_fields: unknown) => ParentMessage.IgnoredChildMessage() })
// @ts-expect-error Even optional extra fields require an explicit custom mapping.
// oxfmt-ignore
ConstructorParent.bindChild(childBlock, { field: 'child', parentMessage: ParentMessage.GotOptionalExtraMessage })

const structuralParentMessage = Object.assign(
  ({ message }: { message: typeof ChildMessage.Type }) =>
    ParentMessage.GotChildMessage({ message }),
  {
    fields: {
      _tag: Schema.Literal('GotChildMessage'),
      message: ChildMessage,
    },
  },
)
// @ts-expect-error parentMessage requires an actual callable Message Schema, not a structural function.
// oxfmt-ignore
ConstructorParent.bindChild(childBlock, { field: 'child', parentMessage: structuralParentMessage })

const repeatedModelConfig: Readonly<{
  field: 'child'
  Model: typeof Schema.String
  parentMessage: typeof ParentMessage.GotChildMessage
}> = {
  field: 'child',
  Model: Schema.String,
  parentMessage: ParentMessage.GotChildMessage,
}
// @ts-expect-error Assigned configs cannot override the owning Definition's Model.
Parent.bindChild(childBlock, repeatedModelConfig)
