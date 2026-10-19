import { Program } from 'foldkit'

import {
  ApplicationComposition,
  documentView,
  elementView,
  helper,
  init,
  update,
} from './assembly-view.accepted.js'

ApplicationComposition.assembleBlock({
  init,
  update,
  // @ts-expect-error An inline view must first be authored with Composition.makeView.
  view: () => ({ title: 'Unowned', body: null }),
})

ApplicationComposition.assembleBlock({
  init,
  update,
  // @ts-expect-error An inline view must first be authored with Composition.makeView.
  view: () => null,
})

ApplicationComposition.assembleBlock({
  init,
  update,
  // @ts-expect-error A precisely typed helper still needs Composition ownership.
  view: helper,
})

const elementBlock = ApplicationComposition.assembleBlock({
  init,
  update,
  view: elementView,
})
// @ts-expect-error Program.make requires a Document view.
Program.make({
  block: elementBlock,
  container: null,
})

const documentBlock = ApplicationComposition.assembleBlock({
  init,
  update,
  view: documentView,
})
// @ts-expect-error Program.makeElement requires an Html view.
Program.makeElement({
  block: documentBlock,
  container: null,
})
