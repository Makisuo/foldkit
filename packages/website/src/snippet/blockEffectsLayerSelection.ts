import { Effect, Option } from 'effect'
import type { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { SaveTheme } from './blockDefinition'
import { Message, Model } from './blockProfile'
import * as Settings from './blockSettings'

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

export const settings = SettingsDemo.connection({
  read: (model: Model) => model.maybeSettings,
  write: (model, nextSettings) =>
    modifyFields(model, { maybeSettings: () => Option.some(nextSettings) }),
  parentMessage: Message.GotSettingsMessage,
  outMessage: { fold: foldSettingsOutMessage },
})
