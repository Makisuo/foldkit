import { Predicate } from 'effect'

import { isCallableTaggedStruct } from '../schema/index.js'
import type { Owner } from './owner.js'

interface OperationMessage {
  readonly _tag: string
}

/** A callable Message variant accepted by `Composition.makeOperation`. */
export type OperationMessageConstructor = Readonly<{
  fields: Readonly<Record<string, unknown>>
  '~type.make.in': unknown
}> &
  ((...args: ReadonlyArray<any>) => OperationMessage)

const OperationTypeId: unique symbol = Symbol('foldkit/Block/Operation')

/** A passive public operation declaration. Block completion combines its Message
 * constructor with the supplied update function to infer payload, dispatch
 * Context, result channels, and graph requirements. It is not callable before
 * completion. */
export interface Operation<
  OwnerId extends string,
  Parameters extends ReadonlyArray<unknown>,
  Message,
> {
  readonly [OperationTypeId]: Readonly<{
    ownerId: OwnerId
    parameters?: Parameters
    Message?: Message
  }>
}

/** @internal Structural bound for any operation declaration. */
export type AnyOperation = Operation<string, ReadonlyArray<unknown>, unknown>

/** Authors a public operation from one local Message constructor. Empty Message
 * variants take no payload argument. Other variants take one constructor
 * payload; completion appends the exact dispatch Context declared by update.
 * Child wrapper Messages cannot be declared as local operations. */
export interface MakeOperation<OwnerId extends string, Message> {
  <
    const FieldName extends string,
    const Input,
    const Output extends OperationMessage,
  >(
    Message: Readonly<{
      fields: Readonly<Record<FieldName, unknown>>
      '~type.make.in': Input
    }> &
      ((...args: ReadonlyArray<any>) => Output) &
      (unknown extends Output
        ? never
        : NoInfer<Output> extends Message
          ? unknown
          : never),
  ): Operation<
    OwnerId,
    [FieldName] extends ['_tag']
      ? readonly []
      : readonly [
          payload:
            | Input
            | (Omit<Output, '_tag'> & Readonly<{ _tag?: Output['_tag'] }>),
        ],
    Output
  >
}

/** @internal Preserves decoded and constructor-default input overloads. */
export type OperationPayload<Constructor extends OperationMessageConstructor> =
  | Constructor['~type.make.in']
  | (Omit<ReturnType<Constructor>, '_tag'> &
      Readonly<{ _tag?: ReturnType<Constructor>['_tag'] }>)

/** @internal Empty variants contribute no placeholder before dispatch Context. */
export type OperationParameters<
  Constructor extends OperationMessageConstructor,
> =
  Exclude<keyof Constructor['fields'], '_tag'> extends never
    ? readonly []
    : readonly [payload: OperationPayload<Constructor>]

type OperationSource = Readonly<{
  ownerToken: object
  Message: OperationMessageConstructor
  hasPayload: boolean
}>

const operationSources = new WeakMap<object, OperationSource>()

/** @internal Creates a passive declaration without constructing a Message. */
export const makeOperation = <
  OwnerId extends string,
  Constructor extends OperationMessageConstructor,
>(
  owner: Owner<OwnerId>,
  Message: Constructor,
): Operation<
  OwnerId,
  OperationParameters<Constructor>,
  ReturnType<Constructor>
> => {
  if (!isCallableTaggedStruct(Message)) {
    throw new Error(
      '[foldkit] makeOperation requires a callable Message variant constructor.',
    )
  }

  const operation = Object.freeze({
    [OperationTypeId]: Object.freeze({ ownerId: owner.id }),
  })

  operationSources.set(operation, {
    ownerToken: owner.token,
    Message,
    hasPayload: Object.keys(Message.fields).some(name => name !== '_tag'),
  })

  return operation
}

/** @internal Recognizes declarations made by a Composition. */
export const isOperation = (value: unknown): value is AnyOperation =>
  Predicate.isObject(value) && operationSources.has(value)

/** @internal Rejects a declaration completed by a different Block owner. */
export const assertOperationOwner = (
  operation: AnyOperation,
  owner: Owner<string>,
): void => {
  if (operationSources.get(operation)?.ownerToken !== owner.token) {
    throw new Error(
      `[foldkit] Block "${owner.id}" operations must be declared by its own Composition.`,
    )
  }
}

/** @internal Recovers the constructor for local Message ownership validation. */
export const operationMessage = (
  operation: AnyOperation,
): OperationMessageConstructor => {
  const source = operationSources.get(operation)

  if (source === undefined) {
    throw new Error('[foldkit] Invalid Block operation declaration.')
  }

  return source.Message
}

/** @internal Constructs a Message at invocation and forwards Context unchanged. */
export const operationInput = (
  operation: AnyOperation,
  args: ReadonlyArray<unknown>,
): ReadonlyArray<unknown> => {
  const source = operationSources.get(operation)

  if (source === undefined) {
    throw new Error('[foldkit] Invalid Block operation declaration.')
  }

  if (source.hasPayload) {
    const [payload, ...context] = args

    return [Reflect.apply(source.Message, undefined, [payload]), ...context]
  } else {
    return [Reflect.apply(source.Message, undefined, []), ...args]
  }
}
