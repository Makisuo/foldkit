import { modifyFields } from 'foldkit/struct'

import { ApplicationDefinition } from './definition'
import { Message } from './message'
import { Model } from './model'
import * as Settings from './settings'

const SettingsBinding = ApplicationDefinition.bindChild(Settings.block, {
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
const goodReset = ApplicationDefinition.step(() =>
  SettingsBinding.setTheme('Light'),
)
