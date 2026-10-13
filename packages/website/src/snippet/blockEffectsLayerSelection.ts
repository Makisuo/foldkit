import { Effect, Option } from 'effect'
import type { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Message, Model } from './blockBindDescriptor'
import * as Settings from './blockOwnedDescriptor'
import { SaveTheme } from './blockOwnerContract'

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
