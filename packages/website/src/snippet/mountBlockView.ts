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

const RegisteredPanelDefinition = PanelDefinition.register({
  mounts: [MeasurePanel],
})

const init = () => ({ model: Model.make({ label: 'Panel' }) })
const update = RegisteredPanelDefinition.update(model => ({ model }))
const view = RegisteredPanelDefinition.view((model, h) =>
  h.div([h.OnMount(MeasurePanel())], [model.label]),
)

export const block = RegisteredPanelDefinition.toBlock({
  init,
  update,
  view,
  EffectsLayer: MeasurePanel.layer,
})
