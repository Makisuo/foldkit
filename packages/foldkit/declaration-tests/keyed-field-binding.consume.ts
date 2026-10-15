import { Array, Layer, Option } from 'effect'

import type { Block, Command, Update } from '../src/index.js'
import {
  ArrayChildBlock,
  CallableChildBlock,
  CallableParent,
  ChildBlock,
  ChildCounter,
  Parent,
  ParentMessage,
  ReadChildCount,
  RefinedId,
  arrayChild,
  brandedEntries,
  callableEntries,
  callableInitialParentModel,
  entries,
  equivalentEntries,
  initialParentModel,
  literalEntries,
  outEntries,
  outEntriesInspection,
  room,
  suspendedEntries,
  wrappedRows,
} from './keyed-field-binding.accepted.js'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value

export type Key = Expect<Equal<Parameters<typeof entries.fold>[1], string>>
export type Placement = Expect<Equal<typeof entries.placement, 'entries'>>
export type CallablePlacement = Expect<
  Equal<typeof callableEntries.placement, 'entries'>
>
export type RoomPlacement = Expect<
  Equal<typeof room.placement, 'DeclarationKeyedFieldChild'>
>
export type CallableParentModel = Expect<
  Equal<
    Parameters<typeof callableEntries.fold>[0],
    typeof CallableParent.Model.Type
  >
>
export type EquivalentKey = Expect<
  Equal<Parameters<typeof equivalentEntries.fold>[1], string>
>
export type SuspendedKey = Expect<
  Equal<Parameters<typeof suspendedEntries.fold>[1], string>
>
export type BrandedKey = Expect<
  Equal<Parameters<typeof brandedEntries.fold>[1], typeof RefinedId.Type>
>
export type LiteralKey = Expect<
  Equal<Parameters<typeof literalEntries.fold>[1], 'Child'>
>
export type ArrayChildPlacement = Expect<
  Equal<typeof arrayChild.placement, 'arrayChild'>
>
export type ArrayChildMessage = Expect<
  Equal<
    Parameters<typeof arrayChild.fold>[1],
    typeof ArrayChildBlock.Message.Type
  >
>
export type ParentModel = Expect<
  Equal<Parameters<typeof entries.fold>[0], typeof Parent.Model.Type>
>
export type ChildMessage = Expect<
  Equal<Parameters<typeof entries.fold>[2], typeof ChildBlock.Message.Type>
>
export type FoldModel = Expect<
  Equal<ReturnType<typeof entries.fold>['model'], typeof Parent.Model.Type>
>
export type Registration = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<typeof entries.fold>>,
    import('../src/index.js').Block.BindingRequirement<
      'entries',
      typeof ChildBlock
    >
  >
>
export type OutKey = Expect<
  Equal<Parameters<typeof outEntries.fold>[1], string>
>
export type OutRefreshRequirements = Expect<
  Equal<
    Update.RequirementsOf<ReturnType<typeof outEntries.refresh>>,
    Block.Scoped<'outEntries', Command.HandlerOf<typeof ReadChildCount>>
  >
>
export type OutInspectionServices = Expect<
  Equal<Layer.Services<typeof outEntriesInspection.EffectsLayer>, ChildCounter>
>

entries.fold(
  initialParentModel,
  'first',
  ChildBlock.Message.UpdatedCount({ count: 2 }),
)
callableEntries.fold(
  callableInitialParentModel,
  'first',
  CallableChildBlock.Message.UpdatedCount({ count: 2 }),
)
arrayChild.fold(initialParentModel, ArrayChildBlock.Message.IgnoredValue())
Option.getOrThrow(Array.head(initialParentModel.entries))
wrappedRows.fold(
  initialParentModel,
  'row',
  ChildBlock.Message.UpdatedCount({ count: 2 }),
)
room.fold(
  initialParentModel,
  'room',
  ChildBlock.Message.UpdatedCount({ count: 2 }),
)

const mapped = ParentMessage.GotEntryMessage({
  id: 'first',
  message: ChildBlock.Message.UpdatedCount({ count: 3 }),
})
void mapped
