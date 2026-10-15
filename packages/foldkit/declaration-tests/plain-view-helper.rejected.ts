import { Layer } from 'effect'

import { defineApplication, Block, Message } from '../src/index.js'
import {
  ApplicationComposition,
  ChildComposition,
  ChildModel,
  ObserveParent,
  Parent,
  ParentModel,
  ParentMessage,
  child,
  childViewHelper,
} from './plain-view-helper.accepted.js'

const OmittedParentComposition = Parent.toComposition()
type OmittedViewBuilder = Block.HtmlBuilderOf<typeof OmittedParentComposition>

const helperWithOmittedChild = (
  model: Readonly<{ child: typeof ChildModel.Type }>,
  h: OmittedViewBuilder,
) =>
  h.block(
    // @ts-expect-error The child Binding is absent from this Composition.
    child.embedView({ slotId: 'child', model: model.child }),
  )

const helperWithOmittedMount = (h: OmittedViewBuilder) =>
  h.div([
    // @ts-expect-error The Mount is absent from this Composition.
    h.OnMount(ObserveParent()),
  ])

const ForeignMessage = Message.defineMessageUnion({ ClickedForeign: {} })

const helperWithForeignMessage = (h: OmittedViewBuilder) =>
  h.button([
    // @ts-expect-error Plain helpers accept only the Composition's Message.
    h.OnClick(ForeignMessage.ClickedForeign()),
  ])

// @ts-expect-error Composition no longer carries a render helper.
OmittedParentComposition.render

ChildComposition.toBlock({
  init: () => ({ model: ChildModel.make({ value: 'initial' }) }),
  update: ChildComposition.update(model => ({ model })),
  // @ts-expect-error A plain view helper cannot complete a Block as its branded view.
  view: childViewHelper,
  EffectsLayer: Layer.empty,
})

const invalidOutputHelper = (_model: typeof ChildModel.Type) => 'text'

ChildComposition.view((model, _h) =>
  // @ts-expect-error A canonical view must return Html rather than arbitrary helper output.
  invalidOutputHelper(model),
)

const Application = defineApplication({
  Model: ParentModel,
  Message: ParentMessage,
})
const OmittedApplicationComposition = Application.toComposition()
type ApplicationViewBuilder = Block.HtmlBuilderOf<
  typeof OmittedApplicationComposition
>
const applicationViewHelper = (
  model: typeof ParentModel.Type,
  h: ApplicationViewBuilder,
) => h.main([], [model.child.value])

const applicationHelperWithOmittedChild = (
  model: typeof ParentModel.Type,
  h: ApplicationViewBuilder,
) =>
  h.block(
    // @ts-expect-error The child Binding is absent from this Application Composition.
    child.embedView({ slotId: 'child', model: model.child }),
  )

const applicationHelperWithOmittedMount = (h: ApplicationViewBuilder) =>
  h.div([
    // @ts-expect-error The Mount is absent from this Application Composition.
    h.OnMount(ObserveParent()),
  ])

// @ts-expect-error Application Composition no longer carries a render helper.
OmittedApplicationComposition.render

// @ts-expect-error A plain view helper cannot complete an Application as its branded view.
OmittedApplicationComposition.toElement({
  container: null,
  init: () => ({
    model: ParentModel.make({
      child: ChildModel.make({ value: 'initial' }),
    }),
  }),
  update: Application.update(model => ({ model })),
  view: applicationViewHelper,
})

type ApplicationRegisteredViewBuilder = Block.HtmlBuilderOf<
  typeof ApplicationComposition
>
const applicationHelperWithForeignMessage = (
  h: ApplicationRegisteredViewBuilder,
) =>
  h.button([
    // @ts-expect-error Application helpers retain the root Message exactly.
    h.OnClick(ForeignMessage.ClickedForeign()),
  ])

void helperWithOmittedChild
void helperWithOmittedMount
void helperWithForeignMessage
void applicationHelperWithOmittedChild
void applicationHelperWithOmittedMount
void applicationHelperWithForeignMessage
