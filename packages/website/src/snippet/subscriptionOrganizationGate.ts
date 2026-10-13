import { Message } from './message'
import { Model } from './model'
import * as Settings from './settings'

export const settings = Settings.block.connection({
  Model: Model,
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
  subscriptions: {
    when: ({ route }) => route._tag === 'Settings',
  },
})
