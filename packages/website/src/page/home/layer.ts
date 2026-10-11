import { Layer } from 'effect'

import { Menu, Tabs } from '@foldkit/ui'

import * as AsyncCounterDemo from './asyncCounterDemo'
import * as NotePlayerDemo from './notePlayerDemo'
import * as HomeSubscription from './subscription'

export const EffectsLayer = Layer.mergeAll(
  Menu.EffectsLayer,
  Tabs.EffectsLayer,
  AsyncCounterDemo.EffectsLayer,
  NotePlayerDemo.EffectsLayer,
  HomeSubscription.EffectsLayer,
)

export const mounts = Menu.mounts
