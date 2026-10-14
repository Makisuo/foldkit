import { modifyFields } from 'foldkit/struct'

import { ApplicationDefinition } from './application'
import { Message } from './message'
import { Model } from './model'
import * as Settings from './settings'

const settings = ApplicationDefinition.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
})

// ❌ Bad: copying the child Model drops any Commands or OutMessage.
const badReset = (model: Model) => {
  const settingsReset = Settings.setTheme(model.settings, 'Light')

  return { model: modifyFields(model, { settings: () => settingsReset.model }) }
}

// ✅ Good: the projected Step preserves the complete child result.
const goodReset = (model: Model) => settings.setTheme('Light')(model)
