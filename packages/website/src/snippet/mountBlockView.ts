import { Effect, Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

const Model = Schema.Struct({ label: Schema.String })
type Model = typeof Model.Type
const Message = defineMessageUnion({
  CompletedMeasurePanel: { height: Schema.Number },
})

const PanelDefinition = Block.makeDefinition('Panel', { Model, Message })

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
type PanelViewBuilder = Block.ViewBuilderFor<typeof PanelComposition>

const panelView = <Builder extends PanelViewBuilder>(
  model: Model,
  h: Builder,
) => h.div([h.OnMount(MeasurePanel())], [model.label])

const init = PanelComposition.makeInit(() => ({
  model: Model.make({ label: 'PanelDefinition' }),
}))
const update = PanelComposition.makeUpdate(model => ({ model }))
const view = PanelComposition.makeView((model, h) => panelView(model, h))

export const PanelBlock = PanelComposition.assembleBlock({
  init,
  update,
  view,
  EffectsLayer: MeasurePanel.layer,
})
