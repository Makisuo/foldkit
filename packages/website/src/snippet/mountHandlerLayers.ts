import { Effect, Option, Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

const Model = Schema.Struct({ panelHeight: Schema.Option(Schema.Number) })
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

const PanelComposition = Panel.toComposition({
  mounts: [MeasurePanel],
})

const update = PanelComposition.update((model, message) =>
  Message.match(message, {
    CompletedMeasurePanel: ({ height }) => ({
      model: modifyFields(model, {
        panelHeight: () => Option.some(height),
      }),
    }),
  }),
)

const view = PanelComposition.view((model, h) => ({
  title: 'Measured panel',
  body: h.div(
    [h.OnMount(MeasurePanel())],
    [
      Option.match(model.panelHeight, {
        onNone: () => 'Measuring',
        onSome: height => `Height: ${height}`,
      }),
    ],
  ),
}))

export const block = PanelComposition.toBlock({
  init: () => ({ model: Model.make({ panelHeight: Option.none() }) }),
  update,
  view,
  EffectsLayer: MeasurePanel.layer,
})
