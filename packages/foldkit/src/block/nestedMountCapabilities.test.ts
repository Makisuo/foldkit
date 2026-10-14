import { Effect, Schema } from 'effect'
import { expect, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { define } from './define.js'

const LeafModel = Schema.Struct({ count: Schema.Number })
const LeafMessage = defineMessageUnion({ CompletedObserveLeaf: {} })
const MountCapabilityLeaf = define('MountCapabilityLeaf', {
  Model: LeafModel,
  Message: LeafMessage,
})
const ObserveLeaf = MountCapabilityLeaf.mount('ObserveLeaf', {
  messages: [LeafMessage.CompletedObserveLeaf],
  handler: function* () {
    return () => Effect.succeed(LeafMessage.CompletedObserveLeaf())
  },
})
const leafRegistered = MountCapabilityLeaf.toComposition({
  mounts: [ObserveLeaf],
})
const leafView = leafRegistered.view((model, h) =>
  h.div([h.OnMount(ObserveLeaf())], [globalThis.String(model.count)]),
)
const leafBlock = leafRegistered.toBlock({
  init: () => ({ model: LeafModel.make({ count: 0 }) }),
  update: MountCapabilityLeaf.update(model => ({ model })),
  view: leafView,
  EffectsLayer: ObserveLeaf.layer,
})

const MiddleModel = Schema.Struct({ leaf: LeafModel })
const MiddleMessage = defineMessageUnion({
  GotLeafMessage: { message: LeafMessage },
})
const MountCapabilityMiddle = define('MountCapabilityMiddle', {
  Model: MiddleModel,
  Message: MiddleMessage,
})
const leaf = MountCapabilityMiddle.bindChild(leafBlock, {
  field: 'leaf',
  parentMessage: MiddleMessage.GotLeafMessage,
})
const middleRegistered = MountCapabilityMiddle.toComposition({
  children: [leaf],
})
const middleView = middleRegistered.view((model, h) =>
  h.block(
    leaf.embedView({
      slotId: 'leaf',
      model: model.leaf,
    }),
  ),
)
const middleBlock = middleRegistered.toBlock({
  init: () => ({
    model: MiddleModel.make({ leaf: leaf.init().model }),
  }),
  update: MountCapabilityMiddle.update((model, message) =>
    MiddleMessage.match(message, {
      GotLeafMessage: ({ message }) => leaf.fold(model, message),
    }),
  ),
  view: middleView,
})

const RootModel = Schema.Struct({ middle: MiddleModel })
const RootMessage = defineMessageUnion({
  GotMiddleMessage: { message: MiddleMessage },
})
const MountCapabilityRoot = define('MountCapabilityRoot', {
  Model: RootModel,
  Message: RootMessage,
})
const middle = MountCapabilityRoot.bindChild(middleBlock, {
  field: 'middle',
  parentMessage: RootMessage.GotMiddleMessage,
})
const rootRegistered = MountCapabilityRoot.toComposition({ children: [middle] })
const rootView = rootRegistered.view((model, h) =>
  h.block(
    middle.embedView({
      slotId: 'middle',
      model: model.middle,
    }),
  ),
)
const rootBlock = rootRegistered.toBlock({
  init: () => ({
    model: RootModel.make({ middle: middle.init().model }),
  }),
  update: MountCapabilityRoot.update((model, message) =>
    RootMessage.match(message, {
      GotMiddleMessage: ({ message }) => middle.fold(model, message),
    }),
  ),
  view: rootView,
})

const SiblingMessage = defineMessageUnion({ CompletedObserveSibling: {} })
const MountCapabilitySibling = define('MountCapabilitySibling', {
  Model: MiddleModel,
  Message: SiblingMessage,
})
const ObserveSibling = MountCapabilitySibling.mount('ObserveSibling', {
  messages: [SiblingMessage.CompletedObserveSibling],
})

if (false) {
  MountCapabilityMiddle.view((model, h) =>
    h.block(
      // @ts-expect-error The leaf binding is absent from this graph.
      leaf.embedView({ slotId: 'omitted-leaf', model: model.leaf }),
    ),
  )

  MountCapabilityRoot.view((model, h) =>
    h.block(
      // @ts-expect-error The nested middle binding is absent from this graph.
      middle.embedView({ slotId: 'omitted-middle', model: model.middle }),
    ),
  )

  middleRegistered.view((_model, h) =>
    h.div([
      // @ts-expect-error A sibling Mount is not a capability of the child graph.
      h.OnMount(ObserveSibling()),
    ]),
  )
}

it('carries a leaf Mount capability through two registered parent graphs', () => {
  expect(leafBlock.mounts).toContain(ObserveLeaf)
  expect(middleBlock.mounts).toContain(ObserveLeaf)
  expect(rootBlock.mounts).toContain(ObserveLeaf)
  expect(rootBlock.init().model).toEqual(
    RootModel.make({
      middle: MiddleModel.make({
        leaf: LeafModel.make({ count: 0 }),
      }),
    }),
  )
})
