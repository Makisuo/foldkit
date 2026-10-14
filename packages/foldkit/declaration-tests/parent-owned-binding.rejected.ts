import { Layer, Option, Schema } from 'effect'

import {
  Application as ApplicationModule,
  Block,
  Message,
} from '../src/index.js'
import {
  ChildBlock,
  ParentOutMessage,
} from './parent-owned-binding.accepted.js'

const ParentModel = Schema.Struct({
  child: ChildBlock.Model,
  maybeChild: Schema.Option(ChildBlock.Model),
  entries: Schema.Array(
    Schema.Struct({ id: Schema.Number, child: ChildBlock.Model }),
  ),
})
const ParentMessage = Message.defineMessageUnion({
  GotChildMessage: { message: ChildBlock.Message },
  GotEntryMessage: { id: Schema.Number, message: ChildBlock.Message },
  ForeignMessage: {},
})
const Parent = Block.define('DeclarationRejectedParent', {
  Model: ParentModel,
  Message: ParentMessage,
})
const unregisteredChild = Parent.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: { fold: () => model => ({ model }) },
})

// @ts-expect-error Optional fields cannot use the required-field shorthand.
Parent.bindChild(ChildBlock, {
  field: 'maybeChild',
  parentMessage: ParentMessage.GotChildMessage,
})

const Forwarding = Block.define('DeclarationRejectedForwarding', {
  Model: ParentModel,
  Message: ParentMessage,
  OutMessage: ParentOutMessage,
})
// @ts-expect-error A forwarded OutMessage must belong to the parent contract.
Forwarding.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: {
    forward: (_outMessage: typeof ChildBlock.OutMessage.Type) =>
      ChildBlock.OutMessage.SelectedValue({ value: 'foreign' }),
  },
})

// @ts-expect-error Wrapper constructors with extra fields need a custom mapper.
Parent.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotEntryMessage,
})

// @ts-expect-error A custom mapper must return the established parent Message.
Parent.bindChild(ChildBlock, {
  field: 'child',
  toParentMessage: () => ({ _tag: 'OutsideParentMessage' }),
})

// @ts-expect-error A Binding supplies exactly one parent Message mapping.
Parent.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  toParentMessage: () =>
    ParentMessage.GotChildMessage({
      message: ChildBlock.Message.UpdatedValue({ value: 'next' }),
    }),
})

// @ts-expect-error Keyed Binding keys must be stable primitive instance keys.
Parent.bindChild(ChildBlock, {
  readAll: model => model.entries,
  key: entry => ({ id: entry.id }),
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_id, message) =>
    ParentMessage.GotEntryMessage({ id: 0, message }),
  outMessage: { fold: () => model => ({ model }) },
})

// @ts-expect-error A Definition cannot complete before toComposition.
Parent.toBlock
// @ts-expect-error The breaking staging API has no register alias.
Parent.register
// @ts-expect-error A completed child has no child-owned Binding factory.
ChildBlock.connection
// @ts-expect-error Keyed Bindings are also created by the parent.
ChildBlock.keyedConnection

Parent.toComposition().toBlock({
  init: () => ({
    model: ParentModel.make({
      child: ChildBlock.Model.make({ value: 'initial' }),
      maybeChild: Option.none(),
      entries: [],
    }),
  }),
  update: Parent.update((model, message) =>
    ParentMessage.match(message, {
      GotChildMessage: ({ message }) => unregisteredChild.fold(model, message),
      GotEntryMessage: () => ({ model }),
      ForeignMessage: () => ({ model }),
    }),
  ),
  // @ts-expect-error Child operations require registration in the Composition.
  EffectsLayer: Layer.empty,
})

const Application = ApplicationModule.define({
  Model: ParentModel,
  Message: ParentMessage,
})
// @ts-expect-error A root Application cannot forward a child OutMessage.
Application.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: {
    forward: (_outMessage: typeof ChildBlock.OutMessage.Type) =>
      ParentOutMessage.ForwardedSelectedValue({ value: 'outside-root' }),
  },
})
// @ts-expect-error An Application Definition cannot complete before toComposition.
Application.makeElement
// @ts-expect-error An Application Definition has no register alias.
Application.register
