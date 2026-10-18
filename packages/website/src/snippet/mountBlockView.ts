import { Effect, Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({ label: Schema.String })
const Message = defineMessageUnion({
  CompletedMeasurePanel: { height: Schema.Number },
})

const PanelDefinition = Block.define('Panel', { Model, Message })

const MeasurePanel = PanelDefinition.mount('MeasurePanel', {
  messages: [Message.CompletedMeasurePanel],
  handler: function* () {
    return ({ element }) =>
      Effect.sync(() =>
        Message.CompletedMeasurePanel({
          height: element.getBoundingClientRect().height,
        }),
      )
  },
})

const PanelComposition = PanelDefinition.makeComposition({
  mounts: [MeasurePanel],
})

const init = PanelComposition.makeInit(() => ({
  model: Model.make({ label: 'PanelDefinition' }),
}))
const update = PanelComposition.makeUpdate(model => ({ model }))
const view = PanelComposition.makeView((model, h) =>
  h.div([h.OnMount(MeasurePanel())], [model.label]),
)

export const block = PanelComposition.makeBlock({
  init,
  update,
  view,
  EffectsLayer: MeasurePanel.layer,
})
