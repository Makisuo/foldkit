import { modifyFields } from 'foldkit/struct'

import { Message } from './message'
import { Model } from './model'
import * as Settings from './settings'

const settings = Settings.block.connection({
  Model: Model,
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
})

// ❌ Bad: the parent changes a child field without running Settings.update.
const badReset = (model: Model) => ({
  model: modifyFields(model, {
    settings: current => modifyFields(current, { theme: () => 'Light' }),
  }),
})

// ✅ Good: the child decides the transition and the binding preserves it.
const goodReset = (model: Model) => settings.setTheme('Light')(model)
