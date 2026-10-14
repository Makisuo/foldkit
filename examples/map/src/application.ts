import { Layer } from 'effect'

import {
  FlyTo,
  FocusSearchInput,
  Geolocate,
  LockBodyScroll,
  UnlockBodyScroll,
} from './command'
import { ApplicationDefinition } from './definition'
import { MountMap } from './mount'

export const ApplicationComposition = ApplicationDefinition.toComposition({
  mounts: [MountMap],
})

export const EffectsLayer = Layer.mergeAll(
  FlyTo.layer,
  Geolocate.layer,
  FocusSearchInput.layer,
  LockBodyScroll.layer,
  UnlockBodyScroll.layer,
  MountMap.layer,
)
