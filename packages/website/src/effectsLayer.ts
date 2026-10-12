import { Layer } from 'effect'

import * as Main from './main'
import { ApiReference, Example, Playground, Ui } from './page'
import * as Search from './search'
import * as SnippetCopy from './snippetCopy'
import * as SnippetDisclosure from './snippetDisclosure'
import { LoadPlayground } from './submodels'
import * as Subscriptions from './subscription'

export const EffectsLayer = Layer.mergeAll(
  Main.EffectsLayer,
  LoadPlayground.layer,
  Ui.EffectsLayer,
  Search.EffectsLayer,
  Playground.EffectsLayer,
  ApiReference.EffectsLayer,
  Example.EffectsLayer,
  SnippetCopy.EffectsLayer,
  SnippetDisclosure.EffectsLayer,
  Subscriptions.EffectsLayer,
)
