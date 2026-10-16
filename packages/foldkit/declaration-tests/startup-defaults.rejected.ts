import { Schema } from 'effect'
import { Block } from 'foldkit'

import {
  Application,
  ChildBlock,
  ChildModel,
  EntriesBinding,
  ForeignGenericBinding,
  GenericParent,
  Parent,
  ParentComposition,
  ParentMessage,
  RequiredChildBlock,
  Startup,
  WiderComposition,
} from './startup-defaults.accepted.js'

// @ts-expect-error A required-argument child needs init.args or init: false.
// oxfmt-ignore
Parent.bindChild(RequiredChildBlock, { field: 'automatic', parentMessage: ParentMessage.GotChildMessage, fromParentMessage: false })

// @ts-expect-error Child init arguments retain their exact tuple.
// oxfmt-ignore
Parent.bindChild(RequiredChildBlock, { field: 'automatic', parentMessage: ParentMessage.GotChildMessage, fromParentMessage: false, init: { args: () => ['wrong'] } })

// @ts-expect-error A selector must accept every value allowed by Startup.
// oxfmt-ignore
Parent.bindChild(ChildBlock, { field: 'automatic', placement: 'narrowStartup', parentMessage: ParentMessage.GotChildMessage, fromParentMessage: false, init: { args: (_startup: Readonly<{ count: 1 }>) => [] } })

Parent.bindChild(ChildBlock, {
  field: 'automatic',
  placement: 'readonlyStartup',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
  init: {
    args: startup => {
      // @ts-expect-error Startup Schema fields remain readonly.
      startup.count = 2
      return []
    },
  },
})

// @ts-expect-error Optional child initialization requires an explicit presence selector.
// oxfmt-ignore
Parent.bindChild(ChildBlock, { field: 'maybeChild', parentMessage: ParentMessage.GotChildMessage, fromParentMessage: false, init: true })

// @ts-expect-error Keyed init false cannot replace an occurrence policy.
// oxfmt-ignore
Parent.bindChild(ChildBlock, { field: 'entries', key: 'id', childField: 'child', toParentMessage: (_id, message) => ParentMessage.GotChildMessage({ message }), fromParentMessage: false, init: false })

const optionalInitConfig: Readonly<{
  field: 'automatic'
  parentMessage: typeof ParentMessage.GotChildMessage
  fromParentMessage: false
  init?: false
}> = {
  field: 'automatic',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
}
// @ts-expect-error An optional init policy cannot ambiguously change default startup.
Parent.bindChild(ChildBlock, optionalInitConfig)

const unionInitConfig: Readonly<{
  field: 'automatic'
  parentMessage: typeof ParentMessage.GotChildMessage
  fromParentMessage: false
  init: true | false
}> = {
  field: 'automatic',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
  init: true,
}
// @ts-expect-error A union init policy does not establish one concrete startup policy.
Parent.bindChild(ChildBlock, unionInitConfig)

// @ts-expect-error A default-initialized child field is omitted from the parent-owned Model.
ParentComposition.init((startup: typeof Startup.Type) => ({
  startup,
  model: {
    automatic: ChildModel.make({ count: 1 }),
    optedOut: ChildModel.make({ count: 9 }),
    status: 'Ready',
  },
}))

// @ts-expect-error An opted-out required child remains a mandatory parent-owned field.
ParentComposition.init((startup: typeof Startup.Type) => ({
  startup,
  model: { status: 'Ready' },
}))

WiderComposition.init(() => ({
  // @ts-expect-error A wider selector annotation cannot widen the declared Startup Schema.
  startup: {},
  model: {},
}))

// @ts-expect-error A Binding cannot change another Definition's Startup contract.
GenericParent.toComposition({ childBindings: [ForeignGenericBinding] })

// @ts-expect-error Application startup selectors use the exact declared Startup.
// oxfmt-ignore
Application.bindChild(ChildBlock, { field: 'child', parentMessage: ParentMessage.GotChildMessage, init: { args: (_startup: Readonly<{ entryIds: readonly [] }>) => [] } })

// @ts-expect-error A keyed startup Binding cannot be registered under an unrelated parent Model.
GenericParent.toComposition({ childBindings: [EntriesBinding] })

const IncompatibleStartupModel = Schema.Struct({
  first: ChildModel,
  second: ChildModel,
})
const IncompatibleStartupParent = Block.define(
  'DeclarationIncompatibleStartupParent',
  {
    Model: IncompatibleStartupModel,
    Message: ParentMessage,
  },
)
const FirstDiscriminantBinding = IncompatibleStartupParent.bindChild(
  ChildBlock,
  {
    field: 'first',
    parentMessage: ParentMessage.GotChildMessage,
    fromParentMessage: false,
    init: { args: (_startup: Readonly<{ kind: 'First' }>) => [] },
  },
)
const SecondDiscriminantBinding = IncompatibleStartupParent.bindChild(
  ChildBlock,
  {
    field: 'second',
    parentMessage: ParentMessage.GotChildMessage,
    fromParentMessage: false,
    init: { args: (_startup: Readonly<{ kind: 'Second' }>) => [] },
  },
)
// @ts-expect-error Disjoint discriminants cannot form one shared startup input.
IncompatibleStartupParent.toComposition({
  childBindings: [FirstDiscriminantBinding, SecondDiscriminantBinding],
})

const PrimitiveStartupParent = Block.define(
  'DeclarationPrimitiveStartupParent',
  {
    Model: IncompatibleStartupModel,
    Message: ParentMessage,
  },
)
const StringStartupBinding = PrimitiveStartupParent.bindChild(ChildBlock, {
  field: 'first',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
  init: { args: (_startup: string) => [] },
})
const NumberStartupBinding = PrimitiveStartupParent.bindChild(ChildBlock, {
  field: 'second',
  parentMessage: ParentMessage.GotChildMessage,
  fromParentMessage: false,
  init: { args: (_startup: number) => [] },
})
// @ts-expect-error Primitive selector inputs cannot form one shared startup input.
PrimitiveStartupParent.toComposition({
  childBindings: [StringStartupBinding, NumberStartupBinding],
})
