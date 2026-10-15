import { Layer } from 'effect'
import type { Block } from 'foldkit'

import { dietListbox, periodListbox } from './childBindings'
import { LoadExternal, NavigateInternal, ReplaceFilters } from './command'
import { Application } from './definition'

export const ApplicationComposition = Application.toComposition({
  children: [dietListbox, periodListbox],
})

export type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>

export const EffectsLayer = Layer.mergeAll(
  ReplaceFilters.layer,
  NavigateInternal.layer,
  LoadExternal.layer,
)
