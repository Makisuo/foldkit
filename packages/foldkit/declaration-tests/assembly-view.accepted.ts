import { Number, Schema } from 'effect'
import { Block, Message, makeApplicationDefinition } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

export const Model = Schema.Struct({ count: Schema.Number })
export const LocalMessage = Message.defineMessageUnion({ ClickedIncrement: {} })
export const ApplicationComposition = makeApplicationDefinition({
  Model,
  Message: LocalMessage,
}).makeComposition()
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
export const init = ApplicationComposition.makeInit(() => ({
  model: { count: 0 },
}))
export const update = ApplicationComposition.makeUpdate(model => ({
  model: modifyFields(model, { count: Number.increment }),
}))
export const helper = (model: typeof Model.Type, h: ApplicationViewBuilder) =>
  h.button(
    [h.OnClick(LocalMessage.ClickedIncrement())],
    [globalThis.String(model.count)],
  )
export const documentView = ApplicationComposition.makeView((model, h) => ({
  title: 'Counter',
  body: helper(model, h),
}))
export const elementView = ApplicationComposition.makeView(helper)
export const application = ApplicationComposition.assembleApplication({
  init,
  update,
  view: documentView,
  container: null,
})
export const element = ApplicationComposition.assembleElement({
  init,
  update,
  view: elementView,
  container: null,
})
