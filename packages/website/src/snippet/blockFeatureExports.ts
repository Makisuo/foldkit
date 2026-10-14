// page/settings/settings.ts
export const block = SettingsDefinition.toBlock({
  init,
  update,
  view,
  expose: { reset },
  EffectsLayer: SaveTheme.layer,
})

// page/settings/index.ts
export { block } from './settings'
export { Model, Theme } from './model'
export { Message, OutMessage } from './message'

// page/index.ts
export * as Settings from './settings'

// Parent
import { Settings } from './page'

Settings.Model
Settings.Message
Settings.OutMessage.match
Settings.block.connection
