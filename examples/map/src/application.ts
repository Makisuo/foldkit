import { Layer } from 'effect'
import type { Block } from 'foldkit'

import {
  FlyTo,
  FocusSearchInput,
  Geolocate,
  LockBodyScroll,
  UnlockBodyScroll,
} from './command'
import { Application } from './definition'
import { MountMap } from './mount'

export const ApplicationComposition = Application.toComposition({
  mounts: [MountMap],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>

export const EffectsLayer = Layer.mergeAll(
  FlyTo.layer,
  Geolocate.layer,
  FocusSearchInput.layer,
  LockBodyScroll.layer,
  UnlockBodyScroll.layer,
  MountMap.layer,
)
