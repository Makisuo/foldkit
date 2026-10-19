import { Message } from 'foldkit'

import {
  ApplicationComposition,
  type ApplicationViewBuilder,
  LocalMessage,
  Model,
  documentView,
  elementView,
  helper,
  init,
  update,
} from './assembly-view.accepted.js'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value

const ForeignMessage = Message.defineMessageUnion({ ClickedForeign: {} })

ApplicationComposition.assembleApplication({
  init,
  update,
  container: null,
  // @ts-expect-error An inline view must first be authored with Composition.makeView.
  view: (model, h) => {
    const exactModel: Expect<Equal<typeof model, typeof Model.Type>> = true
    const exactBuilder: Expect<Equal<typeof h, ApplicationViewBuilder>> = true
    void exactModel
    void exactBuilder
    h.OnClick(LocalMessage.ClickedIncrement())
    // @ts-expect-error Contextual typing retains the local Message contract.
    h.OnClick(ForeignMessage.ClickedForeign())
    return {
      title: 'Unowned',
      body: h.main([], [globalThis.String(model.count)]),
    }
  },
})

ApplicationComposition.assembleElement({
  init,
  update,
  container: null,
  // @ts-expect-error An inline view must first be authored with Composition.makeView.
  view: (model, h) => {
    const exactModel: Expect<Equal<typeof model, typeof Model.Type>> = true
    const exactBuilder: Expect<Equal<typeof h, ApplicationViewBuilder>> = true
    void exactModel
    void exactBuilder
    return h.main([], [globalThis.String(model.count)])
  },
})

ApplicationComposition.assembleElement({
  init,
  update,
  container: null,
  // @ts-expect-error A precisely typed helper still needs Composition ownership.
  view: helper,
})

ApplicationComposition.assembleApplication({
  init,
  update,
  container: null,
  // @ts-expect-error An Element view cannot complete a page-owning Application.
  view: elementView,
})

ApplicationComposition.assembleElement({
  init,
  update,
  container: null,
  // @ts-expect-error A Document view cannot complete an Element.
  view: documentView,
})
