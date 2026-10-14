import { Layer, Schema } from 'effect'

import { Application as ApplicationModule, Message } from '../src/index.js'
import {
  ChildComposition,
  ChildModel,
  ObserveParent,
  Parent,
  ParentMessage,
  child,
  childRender,
} from './owned-render.accepted.js'

const OmittedParentComposition = Parent.toComposition()

OmittedParentComposition.render((model, h) =>
  h.block(
    // @ts-expect-error The child Binding is absent from this Composition.
    child.embedView({ slotId: 'child', model: model.child }),
  ),
)

OmittedParentComposition.render((_model, h) =>
  h.div([
    // @ts-expect-error The Mount is absent from this Composition.
    h.OnMount(ObserveParent()),
  ]),
)

const ForeignMessage = Message.defineMessageUnion({ ClickedForeign: {} })

OmittedParentComposition.render((_model, h) =>
  h.button([
    // @ts-expect-error Owned render helpers accept only the Composition's Message.
    h.OnClick(ForeignMessage.ClickedForeign()),
  ]),
)

// @ts-expect-error Domain render helpers require a concrete input type.
OmittedParentComposition.render.withInput()((_input, h) => h.empty)

ChildComposition.toBlock({
  init: () => ({ model: ChildModel.make({ value: 'initial' }) }),
  update: ChildComposition.update(model => ({ model })),
  // @ts-expect-error A plain render helper cannot complete a Block as its branded view.
  view: childRender,
  EffectsLayer: Layer.empty,
})

const Application = ApplicationModule.define({
  Model: Schema.Struct({ label: Schema.String }),
  Message: ParentMessage,
})
const ApplicationComposition = Application.toComposition()
const applicationRender = ApplicationComposition.render((model, h) =>
  h.main([], [model.label]),
)

// @ts-expect-error A plain render helper cannot complete an Application as its branded view.
ApplicationComposition.makeElement({
  container: null,
  init: () => ({ model: { label: 'initial' } }),
  update: Application.update(model => ({ model })),
  view: applicationRender,
})
