import { Effect, Option } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { Message, Model } from './submodelBindDescriptor'
import * as Settings from './submodelOwnedDescriptor'
import { Message as SettingsMessage, SaveTheme } from './submodelOwnerContract'

// Select the local recipe before binding and registering this placement.
const SettingsTest = Settings.withEffectsLayer(
  SaveTheme.toLayer(
    Effect.succeed(() => Effect.succeed(SettingsMessage.CompletedSaveTheme())),
  ),
)

export const settings = SettingsTest.bind({
  placement: 'settings',
  read: (model: Model) => model.maybeSettings,
  write: (model, nextSettings) =>
    modifyFields(model, { maybeSettings: () => Option.some(nextSettings) }),
  toParentMessage: message => Message.GotSettingsMessage({ message }),
  outMessage: {
    fold: Settings.OutMessage.match({
      ChangedTheme:
        ({ theme }) =>
        (model: Model) => ({
          model: modifyFields(model, { previewTheme: () => theme }),
        }),
    }),
  },
})
