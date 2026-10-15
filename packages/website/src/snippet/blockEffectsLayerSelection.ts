import { Effect } from 'effect'
import type { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { SaveTheme } from './blockDefinition'
import { Message, Model } from './blockProfile'
import * as Settings from './blockSettings'
import { Application } from './definition'

const SettingsDemo = Settings.block.replaceEffectsLayer(
  SaveTheme.toLayer(
    Effect.succeed(() => Effect.succeed(Settings.Message.CompletedSaveTheme())),
  ),
)

const foldSettingsOutMessage = Settings.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedTheme:
    ({ theme }) =>
    model => ({
      model: modifyFields(model, { previewTheme: () => theme }),
    }),
})

export const settings = Application.bindChild(SettingsDemo, {
  placement: 'Settings',
  field: 'maybeSettings',
  parentMessage: Message.GotSettingsMessage,
  outMessage: { fold: foldSettingsOutMessage },
})
