import { Option } from 'effect'
import type { Block } from 'foldkit'

import {
  CallableModel,
  ChildMessage,
  Model,
  ParentMessage,
  arrayChild,
  callableOptional,
  callableRequired,
  composition,
  customIgnoredMessage,
  initial,
  nestedOptional,
  nestedRequired,
  optional,
  required,
  suspendedOptional,
} from './direct-field.accepted.js'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Assert<Value extends true> = Value
export type OptionalPlacement = Assert<
  Equal<typeof optional.placement, 'maybeChild'>
>
export type RequiredPlacement = Assert<
  Equal<typeof required.placement, 'child'>
>
export type SuspendedOptionalPlacement = Assert<
  Equal<typeof suspendedOptional.placement, 'suspendedMaybeChild'>
>
export type NestedRequiredPlacement = Assert<
  Equal<typeof nestedRequired.placement, 'nestedChild'>
>
export type NestedOptionalPlacement = Assert<
  Equal<typeof nestedOptional.placement, 'maybeNestedChild'>
>
export type ArrayChildPlacement = Assert<
  Equal<typeof arrayChild.placement, 'arrayChild'>
>
export type CustomIgnoredPlacement = Assert<
  Equal<typeof customIgnoredMessage.placement, 'customIgnoredMessage'>
>
export type OperationArgs = Assert<
  Equal<Parameters<typeof optional.setCount>, [count: number]>
>
const result = optional.setCount(2)(initial)
export type ParentReturn = Assert<Equal<typeof result.model, typeof Model.Type>>
export type Builder = Block.ViewBuilderFor<typeof composition>
optional.fold(initial, ChildMessage.UpdatedCount({ count: 3 }))
optional.setCount(4)(initial)
suspendedOptional.fold(initial, ChildMessage.UpdatedCount({ count: 3 }))
nestedRequired.fold(initial, ChildMessage.UpdatedCount({ count: 3 }))
nestedOptional.fold(initial, ChildMessage.UpdatedCount({ count: 3 }))
arrayChild.fold(initial, ChildMessage.UpdatedCount({ count: 3 }))
ParentMessage.GotChildMessage({
  message: ChildMessage.UpdatedCount({ count: 1 }),
})
// @ts-expect-error Emitted exposed operation arguments retain their exact types.
optional.setCount('wrong')
optional.setCount(1)({
  child: { count: 1 },
  maybeChild: Option.none(),
  // @ts-expect-error Emitted parent operations retain the parent Model.
  route: 'Foreign',
})

const callableInitial = CallableModel({
  child: { count: 0 },
  maybeChild: Option.none(),
})
const callableResult = callableRequired.setCount(1)(callableInitial)
export type CallableParentReturn = Assert<
  Equal<typeof callableResult.model, typeof CallableModel.Type>
>
export type CallableOptionalPlacement = Assert<
  Equal<typeof callableOptional.placement, 'maybeChild'>
>
