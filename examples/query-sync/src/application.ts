import { Layer } from 'effect'

import { dietListbox, periodListbox } from './childBindings'
import { LoadExternal, NavigateInternal, ReplaceFilters } from './command'
import { Application } from './definition'

export const ApplicationComposition = Application.toComposition({
  children: [dietListbox, periodListbox],
})

export const EffectsLayer = Layer.mergeAll(
  ReplaceFilters.layer,
  NavigateInternal.layer,
  LoadExternal.layer,
)
