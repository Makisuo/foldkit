import { Option, Predicate, type Schema } from 'effect'

import { modifyFields } from '../struct/index.js'
import type {
  BindableBlock,
  Binding,
  BindingBaseConfig,
  MessageMapping,
  ValidateStaticPolicy,
} from './binding.js'
import type { ValidateConcreteComposition } from './requirements.js'

type ReturnOf<Function> = Function extends (
  ...args: ReadonlyArray<never>
) => infer Output
  ? Output
  : never

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false

/** @internal Exact required Struct fields that can store the child Model. */
export type RequiredDirectField<Model, Child> = Extract<
  {
    [Field in keyof Model]-?: {} extends Pick<Model, Field>
      ? never
      : 0 extends 1 & Model[Field]
        ? never
        : Equal<Model[Field], Child> extends true
          ? Field
          : never
  }[keyof Model],
  string
>

type DirectConfig<
  BlockValue extends BindableBlock,
  ModelSchema extends Schema.Struct<Schema.Struct.Fields>,
  ToParentMessage,
  Field extends RequiredDirectField<
    ModelSchema['Type'],
    BlockValue['Model']['Type']
  >,
  Placement extends string,
> = Omit<
  BindingBaseConfig<
    BlockValue,
    ModelSchema['Type'],
    ReturnOf<ToParentMessage>,
    Placement
  >,
  'read' | 'write' | 'toParentMessage' | 'parentMessage' | 'outMessage'
> &
  Readonly<{
    Model: ModelSchema
    field: Field
    read?: never
    write?: never
  }> &
  MessageMapping<BlockValue, ToParentMessage> &
  ValidateConcreteComposition<BlockValue>

/** @internal Required-field shorthand for a checked static Binding. */
export type DirectConnection<BlockValue extends BindableBlock> =
  BlockValue extends Readonly<{
    OutMessage: Readonly<{ Type: infer ChildOutMessage }>
  }>
    ? <
        const ModelSchema extends Schema.Struct<Schema.Struct.Fields>,
        const ToParentMessage,
        const Policy,
        const Field extends RequiredDirectField<
          ModelSchema['Type'],
          BlockValue['Model']['Type']
        >,
        const Placement extends string = Field,
      >(
        config: DirectConfig<
          BlockValue,
          ModelSchema,
          ToParentMessage,
          Field,
          Placement
        > &
          Readonly<{
            outMessage: Policy
          }> &
          ValidateStaticPolicy<
            Policy,
            NoInfer<ModelSchema['Type']>,
            NoInfer<BlockValue['Message']['Type']>,
            NoInfer<ReturnOf<ToParentMessage>>,
            NoInfer<ChildOutMessage>
          >,
      ) => Binding<
        BlockValue,
        ModelSchema['Type'],
        ReturnOf<ToParentMessage>,
        Placement,
        Policy
      >
    : <
        const ModelSchema extends Schema.Struct<Schema.Struct.Fields>,
        const ToParentMessage,
        const Field extends RequiredDirectField<
          ModelSchema['Type'],
          BlockValue['Model']['Type']
        >,
        const Placement extends string = Field,
      >(
        config: DirectConfig<
          BlockValue,
          ModelSchema,
          ToParentMessage,
          Field,
          Placement
        > &
          Readonly<{
            outMessage?: never
          }>,
      ) => Binding<
        BlockValue,
        ModelSchema['Type'],
        ReturnOf<ToParentMessage>,
        Placement,
        never
      >

const normalizeParentMessage = (
  config: Record<string, unknown>,
): Record<string, unknown> => {
  if (!Object.hasOwn(config, 'parentMessage')) {
    return config
  }

  if (Object.hasOwn(config, 'toParentMessage')) {
    throw new Error(
      '[foldkit] A Binding must supply exactly one parent Message mapping.',
    )
  }

  const { parentMessage, ...policy } = config

  if (!Predicate.isFunction(parentMessage)) {
    throw new Error(
      '[foldkit] A parentMessage Binding must supply a Message constructor.',
    )
  }

  return {
    ...policy,
    toParentMessage: (message: unknown) => parentMessage({ message }),
  }
}

/** @internal Lowers required-field shorthand into the shared reader/writer adapter. */
export const normalizeConnectionConfig = (config: unknown): unknown => {
  if (!Predicate.isObject(config)) {
    return config
  }

  const mapped = normalizeParentMessage(config)

  if (!Object.hasOwn(mapped, 'Model') || !Object.hasOwn(mapped, 'field')) {
    return mapped
  }

  const { Model, field, ...policy } = mapped

  const fields = Predicate.isObjectKeyword(Model)
    ? Reflect.get(Model, 'fields')
    : undefined

  if (
    !Predicate.isString(field) ||
    !Predicate.isObject(fields) ||
    !Object.hasOwn(fields, field)
  ) {
    throw new Error(
      '[foldkit] A direct Binding must select a declared Struct Model field.',
    )
  }

  if (Object.hasOwn(policy, 'read') || Object.hasOwn(policy, 'write')) {
    throw new Error(
      '[foldkit] A direct Binding cannot also supply readers or writers.',
    )
  }

  return {
    ...policy,
    placement: policy['placement'] ?? field,
    read: (model: object) => Option.some(Reflect.get(model, field)),
    write: (model: object, nextChild: unknown) =>
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
      modifyFields(model as Record<string, unknown>, {
        [field]: () => nextChild,
      }),
  }
}
