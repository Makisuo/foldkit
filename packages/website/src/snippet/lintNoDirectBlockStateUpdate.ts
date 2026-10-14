import { modifyFields } from 'foldkit/struct'

import { Application } from './application'
import { Message } from './message'
import { Model } from './model'
import * as Settings from './settings'

const settings = Application.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
})

// ❌ Bad: the parent changes a child field without running Settings.update.
const badReset = (model: Model) => ({
  model: modifyFields(model, {
    settings: current => modifyFields(current, { theme: () => 'Light' }),
  }),
})

// ✅ Good: the child decides the transition and the Binding preserves it.
const goodReset = (model: Model) => settings.setTheme('Light')(model)
