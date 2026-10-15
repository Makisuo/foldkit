import { Array, Predicate, Schema, SchemaAST } from 'effect'

import { modifyFields } from '../struct/index.js'
import type { BindableBlock } from './binding.js'
import { hasSameDecodedSchemaShape } from './decodedSchemaShape.js'
import type { InstanceKey } from './instanceContext.js'
import type { KeyedBindingBaseConfig } from './keyedBinding.js'
import type { ValidateConcreteComposition } from './requirements.js'

type Exact<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false

type Equal<Left, Right> = [Left, Right] extends [Right, Left]
  ? Left extends ReadonlyArray<infer LeftItem>
    ? Right extends ReadonlyArray<infer RightItem>
      ? Exact<LeftItem, RightItem>
      : false
    : Exact<Left, Right>
  : false

type IsAny<Value> = 0 extends 1 & Value ? true : false

type IsNever<Value> = [Value] extends [never] ? true : false

type ReturnOf<Value> = Value extends (
  ...args: ReadonlyArray<never>
) => infer Output
  ? Output
  : never

/** @internal Required Struct fields whose exact value is the child Model array. */
export type RequiredKeyedField<Model, ChildModel> = Extract<
  {
    [Field in keyof Model]-?: {} extends Pick<Model, Field>
      ? never
      : IsAny<Model[Field]> extends true
        ? never
        : Equal<Model[Field], ReadonlyArray<ChildModel>> extends true
          ? Field
          : never
  }[keyof Model],
  string
>

/** @internal Required child Model fields whose values are valid occurrence keys. */
export type RequiredKeyField<ChildModel> =
  IsAny<ChildModel> extends true
    ? never
    : ChildModel extends ReadonlyArray<unknown>
      ? never
      : ChildModel extends object
        ? Extract<
            {
              [Field in keyof ChildModel]-?: {} extends Pick<ChildModel, Field>
                ? never
                : IsAny<ChildModel[Field]> extends true
                  ? never
                  : IsNever<ChildModel[Field]> extends true
                    ? never
                    : [ChildModel[Field]] extends [InstanceKey]
                      ? Field
                      : never
            }[keyof ChildModel],
            string
          >
        : never

/** @internal The exact occurrence key stored by a child Model field. */
export type KeyAt<ChildModel, KeyField extends keyof ChildModel> = Extract<
  ChildModel[KeyField],
  InstanceKey
>

type ValidateParentMessageMapping<Mapper, ParentMessage> =
  IsAny<ReturnOf<Mapper>> extends true
    ? never
    : unknown extends ReturnOf<Mapper>
      ? never
      : [ReturnOf<Mapper>] extends [ParentMessage]
        ? unknown
        : never

/** @internal Narrow adapter config for a Struct child Model array stored directly in a parent Struct field. */
export type KeyedFieldConfig<
  BlockValue extends BindableBlock,
  ParentModelSchema extends Schema.Struct<Schema.Struct.Fields>,
  ParentMessage,
  Mapper,
  Field extends keyof ParentModelSchema['Type'] & string,
  KeyField extends keyof BlockValue['Model']['Type'] & string,
  Placement extends string,
> = Omit<
  KeyedBindingBaseConfig<
    BlockValue,
    ParentModelSchema['Type'],
    ReturnOf<Mapper>,
    BlockValue['Model']['Type'],
    KeyAt<BlockValue['Model']['Type'], KeyField>,
    Placement
  >,
  'placement' | 'readAll' | 'key' | 'read' | 'writeAt' | 'toParentMessage'
> &
  Readonly<{
    /** Selects the required parent Struct field whose exact value is the child
     * Model array. */
    field: Field &
      RequiredKeyedField<ParentModelSchema['Type'], BlockValue['Model']['Type']>
    Model?: never
    ChildModel?: never
    /** Selects the stable child Model identity. Init and update results must
     * preserve the supplied key; the parent owns collection membership. */
    key: KeyField & RequiredKeyField<BlockValue['Model']['Type']>
    /** Identifies this Binding within the parent's composition graph. It
     * defaults to `field`. */
    placement?: Placement
    /** Maps a child Message with the originating occurrence key into the parent
     * Message type. */
    toParentMessage: Mapper &
      ((
        key: KeyAt<BlockValue['Model']['Type'], KeyField>,
        message: BlockValue['Message']['Type'],
      ) => unknown)
    parentMessage?: never
    presentWhen?: never
    readAll?: never
    read?: never
    write?: never
    writeAt?: never
  }> &
  ValidateParentMessageMapping<Mapper, ParentMessage> &
  ValidateConcreteComposition<BlockValue> &
  (BlockValue['Model'] extends Readonly<{ fields: Schema.Struct.Fields }>
    ? unknown
    : never)

const fieldsOf = (schema: unknown): unknown =>
  Schema.isSchema(schema) ? Reflect.get(schema, 'fields') : undefined

/** @internal Whether a parent Struct field is the exact child Model array storage shape. */
export const isKeyedFieldStorage = (
  parentModel: unknown,
  childModel: unknown,
  field: unknown,
): boolean => {
  const parentFields = fieldsOf(parentModel)
  if (
    !Predicate.isString(field) ||
    !Predicate.isObject(parentFields) ||
    !Object.hasOwn(parentFields, field)
  ) {
    return false
  }

  const fieldSchema = Reflect.get(parentFields, field)
  return (
    Schema.isSchema(fieldSchema) &&
    Schema.isSchema(childModel) &&
    hasSameDecodedSchemaShape(fieldSchema, Schema.Array(childModel))
  )
}

const isOptionalField = (fieldSchema: unknown): boolean => {
  if (!Predicate.isObjectKeyword(fieldSchema)) {
    return false
  }

  const ast = Reflect.get(fieldSchema, 'ast')
  if (!Predicate.isObject(ast)) {
    return false
  }

  const context = Reflect.get(ast, 'context')
  return (
    Predicate.isObject(context) && Reflect.get(context, 'isOptional') === true
  )
}

const isInstanceKeyAst = (
  ast: SchemaAST.AST,
  visited: Set<SchemaAST.AST>,
): boolean => {
  if (visited.has(ast)) {
    return true
  }

  visited.add(ast)
  if (SchemaAST.isSuspend(ast)) {
    return isInstanceKeyAst(ast.thunk(), visited)
  }

  if (
    SchemaAST.isString(ast) ||
    SchemaAST.isNumber(ast) ||
    SchemaAST.isTemplateLiteral(ast)
  ) {
    return true
  }

  if (SchemaAST.isLiteral(ast)) {
    return (
      Predicate.isString(ast.literal) ||
      (Predicate.isNumber(ast.literal) &&
        globalThis.Number.isFinite(ast.literal))
    )
  }

  return (
    SchemaAST.isUnion(ast) &&
    Array.every(ast.types, type => isInstanceKeyAst(type, visited))
  )
}

const isInstanceKeySchema = (schema: unknown): boolean =>
  Schema.isSchema(schema) &&
  isInstanceKeyAst(SchemaAST.toType(schema.ast), new Set())

const readInstanceKey = (
  childModel: unknown,
  keyField: string,
): InstanceKey => {
  if (!Predicate.isObject(childModel)) {
    throw new Error(
      '[foldkit] A keyed field Binding child Model must be an object with its declared key field.',
    )
  }

  const key = Reflect.get(childModel, keyField)
  if (
    !Predicate.isString(key) &&
    !(Predicate.isNumber(key) && globalThis.Number.isFinite(key))
  ) {
    throw new Error(
      '[foldkit] A keyed field Binding requires string or finite number keys.',
    )
  }

  return key
}

const assertMatchingChildKey = (
  key: InstanceKey,
  childModel: unknown,
  keyField: string,
): void => {
  if (readInstanceKey(childModel, keyField) !== key) {
    throw new Error(
      '[foldkit] A keyed field Binding cannot initialize or replace a child with a different key.',
    )
  }
}

/** @internal Lowers direct keyed-field shorthand into the shared keyed Binding adapter. */
export const normalizeKeyedFieldConfig = (config: unknown): unknown => {
  if (!Predicate.isObject(config)) {
    return config
  }

  const Model = Reflect.get(config, 'Model')
  const ChildModel = Reflect.get(config, 'ChildModel')
  const field = Reflect.get(config, 'field')
  const keyField = Reflect.get(config, 'key')
  const parentFields = fieldsOf(Model)
  const childFields = fieldsOf(ChildModel)

  const allowedFields = new Set([
    'Model',
    'ChildModel',
    'field',
    'key',
    'placement',
    'toParentMessage',
    'subscriptions',
    'outMessage',
    'readAll',
    'read',
    'write',
    'writeAt',
    'presentWhen',
    'parentMessage',
  ])
  for (const configField of Reflect.ownKeys(config)) {
    if (!Predicate.isString(configField) || !allowedFields.has(configField)) {
      throw new Error(
        `[foldkit] A keyed field Binding does not support the config field "${globalThis.String(configField)}".`,
      )
    }
  }

  if (
    !Predicate.isString(field) ||
    !Predicate.isObject(parentFields) ||
    !Object.hasOwn(parentFields, field)
  ) {
    throw new Error(
      '[foldkit] A keyed field Binding must select a declared parent Struct Model field.',
    )
  }

  if (!isKeyedFieldStorage(Model, ChildModel, field)) {
    throw new Error(
      '[foldkit] A keyed field Binding field must be an exact array of the child Model.',
    )
  }

  const fieldSchema = Reflect.get(parentFields, field)
  if (
    !Schema.isSchema(ChildModel) ||
    !hasSameDecodedSchemaShape(fieldSchema, Schema.Array(ChildModel))
  ) {
    throw new Error(
      '[foldkit] A keyed field Binding field must be an exact array of the child Model.',
    )
  }

  if (
    !Predicate.isString(keyField) ||
    !Predicate.isObject(childFields) ||
    !Object.hasOwn(childFields, keyField)
  ) {
    throw new Error(
      '[foldkit] A keyed field Binding must select a declared child Model key field.',
    )
  }

  if (isOptionalField(Reflect.get(childFields, keyField))) {
    throw new Error(
      '[foldkit] A keyed field Binding key field must be required.',
    )
  }

  if (!isInstanceKeySchema(Reflect.get(childFields, keyField))) {
    throw new Error(
      '[foldkit] A keyed field Binding key field Schema must decode to a string or number.',
    )
  }

  for (const adapterField of [
    'readAll',
    'read',
    'write',
    'writeAt',
    'presentWhen',
    'parentMessage',
  ]) {
    if (Object.hasOwn(config, adapterField)) {
      throw new Error(
        '[foldkit] A keyed field Binding cannot also supply custom accessors, presentWhen, or a parentMessage mapping.',
      )
    }
  }

  const toParentMessage = Reflect.get(config, 'toParentMessage')
  if (!Predicate.isFunction(toParentMessage)) {
    throw new Error(
      '[foldkit] A keyed field Binding must supply an explicit key-aware toParentMessage mapper.',
    )
  }

  const { Model: _, ChildModel: __, field: ___, key: ____, ...policy } = config
  const readAll = (model: object): ReadonlyArray<unknown> => {
    const children = Reflect.get(model, field)
    if (!globalThis.Array.isArray(children)) {
      throw new Error(
        `[foldkit] Keyed field Binding field "${field}" must contain an array of child Models.`,
      )
    }

    return children
  }

  return {
    ...policy,
    placement: Reflect.get(policy, 'placement') ?? field,
    readAll,
    key: (childModel: unknown) => readInstanceKey(childModel, keyField),
    read: (childModel: unknown) => childModel,
    validateChildKey: (key: InstanceKey, childModel: unknown) =>
      assertMatchingChildKey(key, childModel, keyField),
    writeAt: (
      model: globalThis.Record<string, unknown>,
      key: InstanceKey,
      nextChildModel: unknown,
    ) => {
      assertMatchingChildKey(key, nextChildModel, keyField)

      return modifyFields(model, {
        [field]: children => {
          if (!globalThis.Array.isArray(children)) {
            throw new Error(
              '[foldkit] A keyed field Binding field must contain an array.',
            )
          }

          return Array.map(children, childModel =>
            readInstanceKey(childModel, keyField) === key
              ? nextChildModel
              : childModel,
          )
        },
      })
    },
  }
}
