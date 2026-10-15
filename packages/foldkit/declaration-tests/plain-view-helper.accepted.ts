import { Effect, Layer, Schema } from 'effect'

import { Block, type Html, Message, defineApplication } from '../src/index.js'

export const ChildModel = Schema.Struct({ value: Schema.String })
const ChildMessage = Message.defineMessageUnion({ ClickedChild: {} })
const Child = Block.define('DeclarationViewHelperChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
export const ChildComposition = Child.toComposition()
type ChildViewBuilder = Block.ViewBuilderFor<typeof ChildComposition>
export const childViewHelper = (
  model: typeof ChildModel.Type,
  h: ChildViewBuilder,
) => h.span([], [model.value])
const childView = ChildComposition.view((model, h) => childViewHelper(model, h))
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
export const Parent = Block.define('DeclarationViewHelperParent', {
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
export type ParentViewBuilder = Block.ViewBuilderFor<typeof ParentComposition>

export const parentModelViewHelper = (
  model: typeof ParentModel.Type,
  h: ParentViewBuilder,
) =>
  h.div(
    [
      h.OnClick(ParentMessage.CompletedObserveParent()),
      h.OnMount(ObserveParent()),
    ],
    [h.block(child.embedView({ slotId: 'child', model: model.child }))],
  )

export const parentBuilderViewHelper = (h: ParentViewBuilder) =>
  h.div([h.OnMount(ObserveParent())])

export const parentInputViewHelper = (
  childModel: typeof ChildModel.Type,
  h: ParentViewBuilder,
) => h.block(child.embedView({ slotId: 'child-input', model: childModel }))

export const parentArrayViewHelper = (
  labels: ReadonlyArray<string>,
  h: ParentViewBuilder,
) => labels.map(label => h.span([], [label]))

const sharedDivider = <SharedMessage, SharedRequirements>(
  h: Html.HtmlBuilder<SharedMessage, SharedRequirements>,
) => h.div([h.Class('divider')])

export const parentSharedViewHelper = (h: ParentViewBuilder) => sharedDivider(h)

const Application = defineApplication({
  Model: ParentModel,
  Message: ParentMessage,
})
export const ApplicationComposition = Application.toComposition({
  children: [child],
  mounts: [ObserveParent],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>

export const applicationModelViewHelper = (
  model: typeof ParentModel.Type,
  h: ApplicationViewBuilder,
) =>
  h.main(
    [h.OnMount(ObserveParent())],
    [
      h.block(
        child.embedView({ slotId: 'application-child', model: model.child }),
      ),
    ],
  )

export const applicationBuilderViewHelper = (h: ApplicationViewBuilder) =>
  h.main([])

export const applicationInputViewHelper = (
  label: string,
  h: ApplicationViewBuilder,
) => h.span([], [label])

export const applicationArrayViewHelper = (
  labels: ReadonlyArray<string>,
  h: ApplicationViewBuilder,
) => labels.map(label => h.span([], [label]))
