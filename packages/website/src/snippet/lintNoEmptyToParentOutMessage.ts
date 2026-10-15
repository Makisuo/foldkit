import { Application } from './definition'
import { Message } from './message'
import { Model } from './model'
import * as Settings from './settings'

// ❌ Bad: this forwarder can never forward an OutMessage.
const badSettings = Application.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
  outMessage: {
    fold: foldSettingsOutMessage,
    forward: () => undefined,
  },
})

// ✅ Good: omit `forward` when every child OutMessage stops here.
const settings = Application.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
  outMessage: { fold: foldSettingsOutMessage },
})
