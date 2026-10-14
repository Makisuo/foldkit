// ❌ Bad: the parent imports and constructs an internal Settings Message.

import { Message as SettingsMessage } from './settings/message'

const settings = Parent.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
})

const update = Parent.update((model, message) =>
  Message.match(message, {
    ClickedResetSettings: () =>
      settings.fold(model, SettingsMessage.ChangedTheme({ theme: 'Light' })),
  }),
)
