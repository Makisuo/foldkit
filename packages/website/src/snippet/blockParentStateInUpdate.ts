import { Option } from 'effect'

export const SettingsBinding = Application.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
  fromParentMessage: {
    parentMessage: Message.GotSettingsMessage,
    args: (model, { message }) => Option.some([message, model.currentUser]),
  },
})
