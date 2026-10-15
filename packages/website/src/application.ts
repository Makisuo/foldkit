import { Layer } from 'effect'
import type { Block } from 'foldkit'

import { children } from './childBindings'
import { LoadPlayground } from './childBindings/home'
import * as Command from './command'
import { Application } from './definition'
import * as Subscriptions from './subscription'

export const ApplicationComposition = Application.toComposition({
  children,
})

export type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>

export const EffectsLayer = Layer.mergeAll(
  Command.EffectsLayer,
  LoadPlayground.layer,
  Subscriptions.EffectsLayer,
)
