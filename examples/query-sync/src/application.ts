import { Layer } from 'effect'

import { dietListbox, periodListbox } from './childBindings'
import { LoadExternal, NavigateInternal, ReplaceFilters } from './command'
import { ApplicationDefinition } from './definition'

export const ApplicationComposition = ApplicationDefinition.toComposition({
  children: [dietListbox, periodListbox],
})

export const EffectsLayer = Layer.mergeAll(
  ReplaceFilters.layer,
  NavigateInternal.layer,
  LoadExternal.layer,
)
