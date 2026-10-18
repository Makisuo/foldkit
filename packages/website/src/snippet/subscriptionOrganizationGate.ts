import { ApplicationDefinition } from './definition'
import { Message } from './message'
import { Model } from './model'
import * as Settings from './settings'

export const SettingsBinding = ApplicationDefinition.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
  subscriptions: {
    when: ({ route }) => route._tag === 'Settings',
  },
})
