import { Effect, Layer, Schema } from 'effect'

import {
  Application as ApplicationModule,
  Block,
  Message,
} from '../src/index.js'

export const ChildModel = Schema.Struct({ value: Schema.String })
const ChildMessage = Message.defineMessageUnion({ ClickedChild: {} })
const Child = Block.define('DeclarationRenderChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
export const ChildComposition = Child.toComposition()
const childView = ChildComposition.view((model, h) => h.span([], [model.value]))
export const childRender = ChildComposition.render((model, h) =>
  h.span([], [model.value]),
)
export const ChildBlock = ChildComposition.toBlock({
  init: () => ({ model: ChildModel.make({ value: 'initial' }) }),
  update: Child.update(model => ({ model })),
  view: childView,
  EffectsLayer: Layer.empty,
})

export const ParentModel = Schema.Struct({ child: ChildModel })
export const ParentMessage = Message.defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
  CompletedObserveParent: {},
})
export const Parent = Block.define('DeclarationRenderParent', {
  Model: ParentModel,
  Message: ParentMessage,
})
export const ObserveParent = Parent.mount('ObserveParent', {
  messages: [ParentMessage.CompletedObserveParent],
  handler: function* () {
    return () => Effect.succeed(ParentMessage.CompletedObserveParent())
  },
})
export const child = Parent.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})
export const ParentComposition = Parent.toComposition({
  children: [child],
  mounts: [ObserveParent],
})

export const parentModelRender = ParentComposition.render((model, h) =>
  h.div(
    [
      h.OnClick(ParentMessage.CompletedObserveParent()),
      h.OnMount(ObserveParent()),
    ],
    [h.block(child.embedView({ slotId: 'child', model: model.child }))],
  ),
)

export const parentBuilderRender = ParentComposition.render.builder(h =>
  h.div([h.OnMount(ObserveParent())]),
)

export const parentInputRender = ParentComposition.render.withInput<
  typeof ChildModel.Type
>()((childModel, h) =>
  h.block(child.embedView({ slotId: 'child-input', model: childModel })),
)

export const parentArrayRender = ParentComposition.render.withInput<
  ReadonlyArray<string>
>()((labels, h) => labels.map(label => h.span([], [label])))

const Application = ApplicationModule.define({
  Model: ParentModel,
  Message: ParentMessage,
})
export const ApplicationComposition = Application.toComposition()
export const applicationModelRender = ApplicationComposition.render(
  (model, h) => h.main([], [model.child.value]),
)
export const applicationBuilderRender = ApplicationComposition.render.builder(
  h => h.main([]),
)
export const applicationInputRender =
  ApplicationComposition.render.withInput<string>()((label, h) =>
    h.span([], [label]),
  )
