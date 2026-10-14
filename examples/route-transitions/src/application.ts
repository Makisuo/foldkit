import { Layer } from 'effect'

import {
  LoadCatalog,
  LoadExternal,
  LoadPainting,
  NavigateInternal,
  SaveDraft,
} from './command'
import { Application } from './definition'

export const ApplicationComposition = Application.toComposition()

export const EffectsLayer = Layer.mergeAll(
  NavigateInternal.layer,
  LoadExternal.layer,
  LoadCatalog.layer,
  LoadPainting.layer,
  SaveDraft.layer,
)
