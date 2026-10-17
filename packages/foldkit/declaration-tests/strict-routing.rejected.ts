import { Option } from 'effect'
import type * as Block from 'foldkit/block'

import {
  CanonicalBinding,
  ChildBlock,
  ContextBinding,
  ContextChildBlock,
  KeyedBinding,
  ParentComposition,
  ParentDefinition,
  ParentMessage,
  ParentModel,
  SilentBinding,
  SilentParentDefinition,
} from './strict-routing.accepted.js'

ParentDefinition.bindChild(ChildBlock, {
  // @ts-expect-error A messageful custom mapper must declare its incoming route.
  field: 'contextualChild',
  toParentMessage: message => ParentMessage.GotContextEvent({ event: message }),
})

ParentDefinition.bindChild(ChildBlock, {
  // @ts-expect-error The manual routing escape is removed.
  field: 'contextualChild',
  toParentMessage: message => ParentMessage.GotContextEvent({ event: message }),
  // @ts-expect-error The manual routing escape is removed.
  fromParentMessage: false,
})

ParentDefinition.bindChild(ContextChildBlock, {
  // @ts-expect-error A contextual canonical wrapper needs explicit native fold arguments.
  field: 'contextualChild',
  // @ts-expect-error A contextual canonical wrapper needs explicit native fold arguments.
  parentMessage: ParentMessage.GotChildMessage,
})

const wrongContextArgs: Block.FromParentMessageArgs<
  typeof ParentModel.Type,
  typeof ParentMessage.GotContextEvent,
  typeof ContextBinding.fold
  // @ts-expect-error The contextual native fold tuple includes DispatchContext.
> = (_model, { event }) => Option.some([event])

void wrongContextArgs

// @ts-expect-error Every inhabitable Got* variant needs an owning Binding.
ParentDefinition.makeComposition()

// @ts-expect-error Registering only one owner leaves other Got* variants unowned.
ParentDefinition.makeComposition({
  childBindings: [CanonicalBinding],
})

const ConflictingBinding = ParentDefinition.bindChild(ChildBlock, {
  field: 'contextualChild',
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
  fromParentMessage: {
    parentMessage: ParentMessage.GotChildMessage,
    args: (_model, { message }) => Option.some([message]),
  },
})

// @ts-expect-error One Got* variant cannot have two owning Bindings.
ParentDefinition.makeComposition({
  childBindings: [
    CanonicalBinding,
    ContextBinding,
    KeyedBinding,
    ConflictingBinding,
  ],
})

ParentComposition.makeUpdate(
  // @ts-expect-error An authored callback cannot narrow itself to a child wrapper.
  (model, _message: typeof ParentMessage.GotChildMessage.Type) => ({ model }),
)

const omittedSilentInitialization = SilentParentDefinition.step(model =>
  SilentBinding.init({ args: [], toParentModel: () => model }),
)
const OmittedSilentComposition = SilentParentDefinition.makeComposition()

// @ts-expect-error Connected initialization requires its storage-only Binding to be registered.
OmittedSilentComposition.makeBlock({
  init: OmittedSilentComposition.makeInit(() => ({
    model: { silent: { ready: false } },
  })),
  update: OmittedSilentComposition.makeUpdate((model, _message) =>
    // @ts-expect-error The omitted Binding requires graph capability at application.
    omittedSilentInitialization(model),
  ),
})
