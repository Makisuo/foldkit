import { Option, Schema } from 'effect'
import { Block } from 'foldkit'

import {
  ApplicationDefinition,
  ChildBlock,
  ChildModel,
  DeclarationStartupDefaultsParentComposition,
  DeclarationStartupDefaultsParentDefinition,
  DeclarationStartupGenericParentComposition,
  DeclarationStartupGenericParentDefinition,
  EntriesBinding,
  ForeignGenericBinding,
  ParentMessage,
  RequiredChildBlock,
  Startup,
} from './startup-defaults.accepted.js'

// @ts-expect-error The startup selector is named startupToArgs.
// oxfmt-ignore
DeclarationStartupDefaultsParentDefinition.bindChild(ChildBlock, { field: 'automatic', parentMessage: ParentMessage.GotChildMessage, init: { args: () => [] } })

// @ts-expect-error The removed args key cannot accompany startupToArgs.
// oxfmt-ignore
DeclarationStartupDefaultsParentDefinition.bindChild(ChildBlock, { field: 'automatic', parentMessage: ParentMessage.GotChildMessage, init: { startupToArgs: () => [], args: () => [] } })

// @ts-expect-error A required-argument child needs init.startupToArgs or init: false.
// oxfmt-ignore
DeclarationStartupDefaultsParentDefinition.bindChild(RequiredChildBlock, { field: 'automatic', parentMessage: ParentMessage.GotChildMessage,  })

// @ts-expect-error Child init arguments retain their exact tuple.
// oxfmt-ignore
DeclarationStartupDefaultsParentDefinition.bindChild(RequiredChildBlock, { field: 'automatic', parentMessage: ParentMessage.GotChildMessage,  init: { startupToArgs: () => ['wrong'] } })

// @ts-expect-error A selector must accept every value allowed by Startup.
// oxfmt-ignore
DeclarationStartupDefaultsParentDefinition.bindChild(ChildBlock, { field: 'automatic', placement: 'narrowStartup', parentMessage: ParentMessage.GotChildMessage,  init: { startupToArgs: (_startup: Readonly<{ count: 1 }>) => [] } })

DeclarationStartupDefaultsParentDefinition.bindChild(ChildBlock, {
  field: 'automatic',
  placement: 'readonlyStartup',
  parentMessage: ParentMessage.GotChildMessage,

  init: {
    startupToArgs: startup => {
      // @ts-expect-error Startup Schema fields remain readonly.
      startup.count = 2
      return []
    },
  },
})

// @ts-expect-error Optional child initialization requires an explicit presence selector.
// oxfmt-ignore
DeclarationStartupDefaultsParentDefinition.bindChild(ChildBlock, { field: 'maybeChild', parentMessage: ParentMessage.GotChildMessage,  init: true })

// @ts-expect-error Keyed init false cannot replace an occurrence policy.
// oxfmt-ignore
DeclarationStartupDefaultsParentDefinition.bindChild(ChildBlock, { field: 'entries', key: 'id', childField: 'child', toParentMessage: (id, message) => ParentMessage.GotEntryMessage({ id, message }), fromParentMessage: { parentMessage: ParentMessage.GotEntryMessage, args: (_model, { id, message }) => Option.some([id, message]) }, init: false })

const optionalInitConfig: Readonly<{
  field: 'automatic'
  parentMessage: typeof ParentMessage.GotChildMessage
  init?: false
}> = {
  field: 'automatic',
  parentMessage: ParentMessage.GotChildMessage,
}
DeclarationStartupDefaultsParentDefinition.bindChild(
  ChildBlock,
  // @ts-expect-error An optional init policy cannot ambiguously change default startup.
  optionalInitConfig,
)

const unionInitConfig: Readonly<{
  field: 'automatic'
  parentMessage: typeof ParentMessage.GotChildMessage
  init: true | false
}> = {
  field: 'automatic',
  parentMessage: ParentMessage.GotChildMessage,

  init: true,
}
DeclarationStartupDefaultsParentDefinition.bindChild(
  ChildBlock,
  // @ts-expect-error A union init policy does not establish one concrete startup policy.
  unionInitConfig,
)

DeclarationStartupDefaultsParentComposition.makeInit(
  // @ts-expect-error A default-initialized child field is omitted from the parent-owned Model.
  (startup: typeof Startup.Type) => ({
    startup,
    model: {
      automatic: ChildModel.make({ count: 1 }),
      optedOut: ChildModel.make({ count: 9 }),
      status: 'Ready',
    },
  }),
)

DeclarationStartupDefaultsParentComposition.makeInit(
  // @ts-expect-error An opted-out required child remains a mandatory parent-owned field.
  (startup: typeof Startup.Type) => ({
    startup,
    model: { status: 'Ready' },
  }),
)

DeclarationStartupGenericParentComposition.makeInit(() => ({
  // @ts-expect-error A wider selector annotation cannot widen the declared Startup Schema.
  startup: {},
  model: {},
}))

// @ts-expect-error A Binding cannot change another Definition's Startup contract.
DeclarationStartupGenericParentDefinition.makeComposition({
  childBindings: [ForeignGenericBinding],
})

// @ts-expect-error Application startup selectors use the exact declared Startup.
// oxfmt-ignore
ApplicationDefinition.bindChild(ChildBlock, { field: 'child', parentMessage: ParentMessage.GotChildMessage, init: { startupToArgs: (_startup: Readonly<{ entryIds: readonly [] }>) => [] } })

// @ts-expect-error A keyed startup Binding cannot be registered under an unrelated parent Model.
DeclarationStartupGenericParentDefinition.makeComposition({
  childBindings: [EntriesBinding],
})

const IncompatibleStartupModel = Schema.Struct({
  first: ChildModel,
  second: ChildModel,
})
const DeclarationIncompatibleStartupParentDefinition = Block.define(
  'DeclarationIncompatibleStartupParent',
  {
    Model: IncompatibleStartupModel,
    Message: ParentMessage,
  },
)
const FirstDiscriminantBinding =
  DeclarationIncompatibleStartupParentDefinition.bindChild(ChildBlock, {
    field: 'first',
    parentMessage: ParentMessage.GotChildMessage,

    init: { startupToArgs: (_startup: Readonly<{ kind: 'First' }>) => [] },
  })
const SecondDiscriminantBinding =
  DeclarationIncompatibleStartupParentDefinition.bindChild(ChildBlock, {
    field: 'second',
    parentMessage: ParentMessage.GotChildMessage,

    init: { startupToArgs: (_startup: Readonly<{ kind: 'Second' }>) => [] },
  })
// @ts-expect-error Disjoint discriminants cannot form one shared startup input.
DeclarationIncompatibleStartupParentDefinition.makeComposition({
  childBindings: [FirstDiscriminantBinding, SecondDiscriminantBinding],
})

const DeclarationPrimitiveStartupParentDefinition = Block.define(
  'DeclarationPrimitiveStartupParent',
  {
    Model: IncompatibleStartupModel,
    Message: ParentMessage,
  },
)
const StringStartupBinding =
  DeclarationPrimitiveStartupParentDefinition.bindChild(ChildBlock, {
    field: 'first',
    parentMessage: ParentMessage.GotChildMessage,

    init: { startupToArgs: (_startup: string) => [] },
  })
const NumberStartupBinding =
  DeclarationPrimitiveStartupParentDefinition.bindChild(ChildBlock, {
    field: 'second',
    parentMessage: ParentMessage.GotChildMessage,

    init: { startupToArgs: (_startup: number) => [] },
  })
// @ts-expect-error Primitive selector inputs cannot form one shared startup input.
DeclarationPrimitiveStartupParentDefinition.makeComposition({
  childBindings: [StringStartupBinding, NumberStartupBinding],
})
