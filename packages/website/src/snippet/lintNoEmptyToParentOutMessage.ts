import { ApplicationDefinition } from './definition'
import { Message } from './message'
import { Model } from './model'
import * as Settings from './settings'

// ❌ Bad: this forwarder can never forward an OutMessage.
const BadSettingsBinding = ApplicationDefinition.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
  outMessage: {
    fold: foldSettingsOutMessage,
    forward: () => undefined,
  },
})

// ✅ Good: omit `forward` when every child OutMessage stops here.
const SettingsBinding = ApplicationDefinition.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
  outMessage: { fold: foldSettingsOutMessage },
})
