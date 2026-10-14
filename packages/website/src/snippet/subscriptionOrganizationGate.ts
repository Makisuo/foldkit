import { ApplicationDefinition } from './application'
import { Message } from './message'
import { Model } from './model'
import * as Settings from './settings'

export const settings = ApplicationDefinition.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
  subscriptions: {
    when: ({ route }) => route._tag === 'Settings',
  },
})
