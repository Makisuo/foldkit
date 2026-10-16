import { Array, Layer, Option } from 'effect'
import type { Block, Command, Update } from 'foldkit'

import {
  ArrayChildBinding,
  ArrayChildBlock,
  BrandedEntriesBinding,
  CallableChildBlock,
  CallableEntriesBinding,
  CallableParent,
  ChildBlock,
  ChildCounter,
  EntriesBinding,
  EquivalentEntriesBinding,
  InitializedEntriesBinding,
  LiteralEntriesBinding,
  OutEntriesBinding,
  Parent,
  ParentMessage,
  ReadChildCount,
  RefinedId,
  RoomBinding,
  SuspendedEntriesBinding,
  WrappedRowsBinding,
  callableInitialParentModel,
  initialParentModel,
  initializeKeyedParent,
  outEntriesInspection,
} from './keyed-field-binding.accepted.js'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value

export type Key = Expect<
  Equal<Parameters<typeof EntriesBinding.fold>[1], string>
>
export type Placement = Expect<
  Equal<typeof EntriesBinding.placement, 'entries'>
>
export type CallablePlacement = Expect<
  Equal<typeof CallableEntriesBinding.placement, 'entries'>
>
export type RoomPlacement = Expect<
  Equal<typeof RoomBinding.placement, 'DeclarationKeyedFieldChild'>
>
export type CallableParentModel = Expect<
  Equal<
    Parameters<typeof CallableEntriesBinding.fold>[0],
    typeof CallableParent.Model.Type
  >
>
export type EquivalentKey = Expect<
  Equal<Parameters<typeof EquivalentEntriesBinding.fold>[1], string>
>
export type SuspendedKey = Expect<
  Equal<Parameters<typeof SuspendedEntriesBinding.fold>[1], string>
>
export type BrandedKey = Expect<
  Equal<Parameters<typeof BrandedEntriesBinding.fold>[1], typeof RefinedId.Type>
>
export type LiteralKey = Expect<
  Equal<Parameters<typeof LiteralEntriesBinding.fold>[1], 'Child'>
>
export type ArrayChildPlacement = Expect<
  Equal<typeof ArrayChildBinding.placement, 'arrayChild'>
>
export type ArrayChildMessage = Expect<
  Equal<
    Parameters<typeof ArrayChildBinding.fold>[1],
    typeof ArrayChildBlock.Message.Type
  >
>
export type ParentModel = Expect<
  Equal<Parameters<typeof EntriesBinding.fold>[0], typeof Parent.Model.Type>
>
export type ChildMessage = Expect<
  Equal<
    Parameters<typeof EntriesBinding.fold>[2],
    typeof ChildBlock.Message.Type
  >
>
export type FoldModel = Expect<
  Equal<
    ReturnType<typeof EntriesBinding.fold>['model'],
    typeof Parent.Model.Type
  >
>
export type Registration = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<typeof EntriesBinding.fold>>,
    import('foldkit').Block.BindingRequirement<'entries', typeof ChildBlock>
  >
>
export type InitializedPlacement = Expect<
  Equal<typeof InitializedEntriesBinding.placement, 'entries'>
>
export type OutKey = Expect<
  Equal<Parameters<typeof OutEntriesBinding.fold>[1], string>
>
export type OutRefreshRequirements = Expect<
  Equal<
    Update.RequirementsOf<ReturnType<typeof OutEntriesBinding.refresh>>,
    Block.Scoped<'outEntries', Command.HandlerOf<typeof ReadChildCount>>
  >
>
export type OutInspectionServices = Expect<
  Equal<Layer.Services<typeof outEntriesInspection.EffectsLayer>, ChildCounter>
>

EntriesBinding.fold(
  initialParentModel,
  'first',
  ChildBlock.Message.UpdatedCount({ count: 2 }),
)
CallableEntriesBinding.fold(
  callableInitialParentModel,
  'first',
  CallableChildBlock.Message.UpdatedCount({ count: 2 }),
)
ArrayChildBinding.fold(
  initialParentModel,
  ArrayChildBlock.Message.IgnoredValue(),
)
Option.getOrThrow(Array.head(initialParentModel.entries))
WrappedRowsBinding.fold(
  initialParentModel,
  'row',
  ChildBlock.Message.UpdatedCount({ count: 2 }),
)
RoomBinding.fold(
  initialParentModel,
  'room',
  ChildBlock.Message.UpdatedCount({ count: 2 }),
)

const mapped = ParentMessage.GotEntryMessage({
  id: 'first',
  message: ChildBlock.Message.UpdatedCount({ count: 3 }),
})
initializeKeyedParent('Ready')
void mapped
