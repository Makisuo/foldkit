// PARENT UPDATE

import { Message as SettingsMessage } from './settings/message'

ClickedResetSettings: () =>
  settings.fold(model, SettingsMessage.ChangedTheme({ theme: 'Light' }))
