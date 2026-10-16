import { Array, Option } from 'effect'
import { Block, Command, Struct, Update } from 'foldkit'

import {
  ChildMessage,
  CompositionSafetyParent,
  Entry,
  EntryBinding,
  LoadParameterizedChild,
  OptionalContextBlock,
  ParentMessage,
  ParentModel,
  ParameterizedBlock,
  PlainBinding,
  PlainBlock,
  RestContextBlock,
  StableProjectedBinding,
  initialParentModel,
  initialize,
  initializeEntry,
  initializePlain,
  initializePlainWithParentCommands,
} from './composition-safety.accepted.js'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? (<Value>() => Value extends Right ? 1 : 2) extends <
        Value,
      >() => Value extends Left ? 1 : 2
      ? true
      : false
    : false
type Expect<Value extends true> = Value

const initial = initialize()
StableProjectedBinding.fold(initial.model, ChildMessage.Incremented())
PlainBinding.fold(initial.model, ChildMessage.Incremented())
initializeEntry(initialParentModel, 'emitted-entry', 2)

type EmittedEntryInitRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<typeof initializeEntry>,
    Block.Qualify<'entries', Command.HandlerOf<typeof LoadParameterizedChild>>
  >
>
type EmittedParentCommandRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<typeof initializePlainWithParentCommands>,
    Block.Qualify<'entries', Command.HandlerOf<typeof LoadParameterizedChild>>
  >
>
type EmittedParentCommandRegistrationIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<
      ReturnType<typeof initializePlainWithParentCommands>
    >,
    | Block.BindingRequirement<'parentCommands', typeof PlainBlock>
    | Block.BindingRequirement<'entries', typeof ParameterizedBlock>
  >
>
type EmittedEntryInitModelIsExact = Expect<
  Equal<ReturnType<typeof initializeEntry>['model'], typeof ParentModel.Type>
>

declare const useSecondField: boolean

// @ts-expect-error Emitted accessor init projections retain one stable parent Model field.
// oxfmt-ignore
CompositionSafetyParent.bindChild(PlainBlock, { placement: 'emittedUnstableProjected', read: model => Option.some(model.first), write: (model, nextChild) => Struct.modifyFields(model, { first: () => nextChild }), parentMessage: ParentMessage.RoutedProjectedMessage, init: { args: () => [], model: child => useSecondField ? { second: child } : { first: child } } })

// @ts-expect-error Emitted optional update context requires an explicit incoming Message route.
// oxfmt-ignore
CompositionSafetyParent.bindChild(OptionalContextBlock, { field: 'optionalContext', parentMessage: ParentMessage.RoutedOptionalContextMessage })

// @ts-expect-error Emitted required rest update context requires an explicit incoming Message route.
// oxfmt-ignore
CompositionSafetyParent.bindChild(RestContextBlock, { field: 'restContext', parentMessage: ParentMessage.RoutedRestContextMessage })

// @ts-expect-error Emitted connected initializers require their parent configuration.
PlainBinding.init()

// @ts-expect-error Emitted keyed initializers reject the legacy positional form.
EntryBinding.init('entry', 1)

// @ts-expect-error Emitted initializer arguments preserve the child init tuple.
// oxfmt-ignore
EntryBinding.init({ key: 'entry', args: ['one'], toParentModel: child => Struct.modifyFields(initialParentModel, { entries: Array.append(Entry.make({ id: 'entry', child })) }) })

// @ts-expect-error Emitted keyed initializer keys preserve the Binding key type.
// oxfmt-ignore
EntryBinding.init({ key: 1, args: [1], toParentModel: child => Struct.modifyFields(initialParentModel, { entries: Array.append(Entry.make({ id: 'entry', child })) }) })

// @ts-expect-error Emitted initializer projections must construct the complete parent Model.
PlainBinding.init({ args: [], toParentModel: child => child })

declare const erasedParentModel: any
// @ts-expect-error Emitted initializers reject erased parent projections.
PlainBinding.init({ args: [], toParentModel: () => erasedParentModel })

declare const erasedParentCommands: any
// @ts-expect-error Emitted initializers reject erased parent Commands collections.
// oxfmt-ignore
PlainBinding.init({ args: [], toParentModel: child => Struct.modifyFields(initialParentModel, { plain: () => child }), commands: erasedParentCommands })

declare const erasedParentCommandElements: ReadonlyArray<any>
// @ts-expect-error Emitted initializers reject erased parent Command elements.
// oxfmt-ignore
PlainBinding.init({ args: [], toParentModel: child => Struct.modifyFields(initialParentModel, { plain: () => child }), commands: erasedParentCommandElements })

declare const erasedParentCommandRequirements: Update.Commands<
  typeof ParentMessage.Type,
  any
>
// @ts-expect-error Emitted initializers reject erased parent Command requirements.
// oxfmt-ignore
PlainBinding.init({ args: [], toParentModel: child => Struct.modifyFields(initialParentModel, { plain: () => child }), commands: erasedParentCommandRequirements })

declare const unknownParentCommandRequirements: Update.Commands<
  typeof ParentMessage.Type,
  unknown
>
// @ts-expect-error Emitted initializers reject unknown parent Command requirements.
// oxfmt-ignore
PlainBinding.init({ args: [], toParentModel: child => Struct.modifyFields(initialParentModel, { plain: () => child }), commands: unknownParentCommandRequirements })

const EmittedMissingPlainBindingComposition =
  CompositionSafetyParent.toComposition({ childBindings: [EntryBinding] })
EmittedMissingPlainBindingComposition.toBlock({
  init: EmittedMissingPlainBindingComposition.init(() =>
    initializePlain(initialParentModel),
  ),
  update: EmittedMissingPlainBindingComposition.update(model => ({ model })),
  // @ts-expect-error Emitted initializer evidence requires every used Binding at completion.
  EffectsLayer: LoadParameterizedChild.layer,
})

export type EmittedCompositionSafetyAssertions = [
  EmittedEntryInitRequirementsAreExact,
  EmittedParentCommandRequirementsAreExact,
  EmittedParentCommandRegistrationIsExact,
  EmittedEntryInitModelIsExact,
]
