import { Schema } from 'effect'
import { Block, Message, Update } from 'foldkit'
import type { Command } from 'foldkit/command'

export const ChildModel = Schema.Struct({ value: Schema.Number })
export const ChildMessage = Message.defineMessageUnion({
  UpdatedValue: { value: Schema.Number },
})
const Child = Block.define('DeclarationCanonicalConstructorChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const ChildComposition = Child.toComposition()
export const ChildBlock = ChildComposition.toBlock({
  init: ChildComposition.init(() => ({
    model: ChildModel.make({ value: 0 }),
  })),
  update: ChildComposition.update(model => ({ model })),
})
const ParentModel = Schema.Struct({ child: ChildModel })
declare const PayloadWithUnknownDecodingServices: Schema.Codec<
  string,
  string,
  unknown,
  never
>
export const ParentMessage = Message.defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
  GotOtherMessage: { message: ChildMessage },
  GotExtraMessage: { message: ChildMessage, extra: Schema.String },
  GotOptionalExtraMessage: {
    message: ChildMessage,
    extra: Schema.optionalKey(Schema.String),
  },
  GotWrongMessage: { message: Schema.String },
  ReceivedPayload: { payload: PayloadWithUnknownDecodingServices },
})
export const Parent = Block.define('DeclarationCanonicalConstructorParent', {
  Model: ParentModel,
  Message: ParentMessage,
})
export const CanonicalBinding = Parent.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})
export const MappedBinding = Parent.bindChild(ChildBlock, {
  field: 'child',
  toParentMessage: message => ParentMessage.GotOtherMessage({ message }),
  fromParentMessage: false,
})

declare const distinctSchemaMapper: typeof ChildMessage.UpdatedValue &
  ((
    message: typeof ChildMessage.Type,
  ) => typeof ParentMessage.GotOtherMessage.Type)

export const DistinctSchemaMapperBinding = Parent.bindChild(ChildBlock, {
  field: 'child',
  toParentMessage: distinctSchemaMapper,
  fromParentMessage: false,
})

type CommandMessageOf<Output> =
  Output extends Readonly<{
    commands?:
      | ReadonlyArray<Command<infer ReturnedMessage, never, any>>
      | undefined
  }>
    ? ReturnedMessage
    : never

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false

type Expect<Value extends true> = Value

export type CanonicalMessageIsExact = Expect<
  Equal<
    CommandMessageOf<ReturnType<typeof CanonicalBinding.fold>>,
    typeof ParentMessage.GotChildMessage.Type
  >
>
export type MappedMessageIsExact = Expect<
  Equal<
    CommandMessageOf<ReturnType<typeof MappedBinding.fold>>,
    typeof ParentMessage.GotOtherMessage.Type
  >
>
export type DistinctSchemaMapperReturnIsPreserved = Expect<
  Equal<
    CommandMessageOf<ReturnType<typeof DistinctSchemaMapperBinding.fold>>,
    typeof ParentMessage.GotOtherMessage.Type
  >
>
export type CanonicalRegistrationIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<typeof CanonicalBinding.fold>>,
    Block.RequirementOfBinding<typeof CanonicalBinding>
  >
>
