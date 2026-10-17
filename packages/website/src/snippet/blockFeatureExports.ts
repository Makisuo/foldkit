// page/settings/block.ts
const reset = SettingsComposition.makeOperation(Message.RequestedReset)

export const block = SettingsComposition.makeBlock({
  init,
  update,
  view,
  operations: { reset },
  EffectsLayer: SaveTheme.layer,
})

// page/settings/index.ts
export { block } from './block'
export { Model, Theme } from './model'
export { Message, OutMessage } from './message'

// page/index.ts
export * as Settings from './settings'

// Parent
import { Settings } from './page'

Settings.Model
Settings.Message
Settings.OutMessage.match
Settings.block
