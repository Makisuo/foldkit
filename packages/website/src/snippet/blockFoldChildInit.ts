import { Schema, Tuple } from 'effect'

import { Profile } from './definition'
import { Message } from './message'
import { Model } from './model'
import * as Settings from './settings'

const Startup = Schema.Struct({
  username: Schema.String,
  savedTheme: Settings.Theme,
})
type Startup = typeof Startup.Type

const SettingsBinding = Profile.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
  init: {
    args: ({ savedTheme }: Startup) => Tuple.make({ theme: savedTheme }),
  },
})

const ProfileComposition = Profile.toComposition({
  childBindings: [SettingsBinding],
})

const init = ProfileComposition.init((startup: Startup) => ({
  startup,
  model: { username: startup.username },
}))
