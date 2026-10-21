// page/settings/block.ts
const requestReset = Message.RequestedReset

export const SettingsBlock = SettingsComposition.assembleBlock({
  init,
  update,
  view,
  operations: { requestReset },
  EffectsLayer: SaveTheme.layer,
})

// page/settings/index.ts
export { Model } from './model'
export { SettingsBlock } from './block'

// Parent model.ts
import { Schema } from 'effect'

import * as Settings from './page/settings'

export const Model = Schema.Struct({ settings: Settings.Model })

// Parent composition.ts
import { SettingsBlock } from './page/settings'

ApplicationDefinition.makeBinding(SettingsBlock, {
  field: 'settings',
  init: false,
}).withOutMessagePolicy({ fold: foldSettingsOutMessage })
