import { Layer } from 'effect'

import { Menu, Tabs } from '@foldkit/ui'

export const EffectsLayer = Layer.mergeAll(Menu.EffectsLayer, Tabs.EffectsLayer)
