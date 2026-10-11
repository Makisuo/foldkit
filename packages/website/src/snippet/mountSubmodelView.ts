import { Effect, Schema } from 'effect'
import { Mount, Submodel } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({ label: Schema.String })
type Model = typeof Model.Type

const Message = defineMessageUnion({
  CompletedMeasurePanel: { height: Schema.Number },
})
type Message = typeof Message.Type

const MeasurePanel = Mount.define('MeasurePanel', {
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

export const mounts = [MeasurePanel]
export const EffectsLayer = MeasurePanel.layer

export const view = Submodel.defineView<
  Model,
  Message,
  void,
  Mount.RequirementsOf<typeof mounts>
>((model, h) => h.div([h.OnMount(MeasurePanel())], [model.label]))
