import { Number, Schema } from 'effect'
import { Block, Message, Program } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

export const Model = Schema.Struct({ count: Schema.Number })
export const LocalMessage = Message.defineMessageUnion({ ClickedIncrement: {} })
export const ApplicationComposition = Block.makeDefinition('Application', {
  Model,
  Message: LocalMessage,
}).makeComposition()
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value

const ForeignMessage = Message.defineMessageUnion({ ClickedForeign: {} })

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
export const contextualView = ApplicationComposition.makeView((model, h) => {
  const exactModel: Expect<Equal<typeof model, typeof Model.Type>> = true
  const exactBuilder: Expect<Equal<typeof h, ApplicationViewBuilder>> = true
  void exactModel
  void exactBuilder
  h.OnClick(LocalMessage.ClickedIncrement())
  // @ts-expect-error Composition.makeView retains the local Message contract.
  h.OnClick(ForeignMessage.ClickedForeign())
  return h.main([], [globalThis.String(model.count)])
})

const assemble = () =>
  ApplicationComposition.assembleBlock({
    init,
    update,
    view: documentView,
  })
const completedBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemble
> = Block.complete(assemble)
export const application = Program.make({
  block: completedBlock,
  container: null,
})

const assemble2 = () =>
  ApplicationComposition.assembleBlock({
    init,
    update,
    view: elementView,
  })
const completedBlock2: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemble2
> = Block.complete(assemble2)
export const element = Program.makeElement({
  block: completedBlock2,
  container: null,
})
