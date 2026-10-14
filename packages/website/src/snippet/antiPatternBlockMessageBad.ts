// ❌ Bad: the parent imports and constructs an internal Settings Message.

import { Message as SettingsMessage } from './settings/message'

const settings = ParentDefinition.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
})

const update = ParentDefinition.update((model, message) =>
  Message.match(message, {
    ClickedResetSettings: () =>
      settings.fold(model, SettingsMessage.ChangedTheme({ theme: 'Light' })),
  }),
)
