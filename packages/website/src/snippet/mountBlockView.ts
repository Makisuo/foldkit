import { Effect, Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({ label: Schema.String })
const Message = defineMessageUnion({
  CompletedMeasurePanel: { height: Schema.Number },
})

const Panel = Block.define('Panel', { Model, Message })

const MeasurePanel = Panel.mount('MeasurePanel', {
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

const panel = Panel.register({ mounts: [MeasurePanel] })

const init = () => ({ model: Model.make({ label: 'Panel' }) })
const update = panel.update(model => ({ model }))
const view = panel.view((model, h) =>
  h.div([h.OnMount(MeasurePanel())], [model.label]),
)

export const block = panel.assemble({
  init,
  update,
  view,
  EffectsLayer: MeasurePanel.layer,
})
