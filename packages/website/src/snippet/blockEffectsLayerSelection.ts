import { Effect } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { SaveTheme } from './blockDefinition'
import { ApplicationDefinition } from './blockProfileContract'
import * as Settings from './blockSettings'

const SettingsDemo = Settings.SettingsBlock.replaceEffectsLayer(
  SaveTheme.toLayer(
    Effect.succeed(() =>
      Effect.succeed(Settings.SettingsBlock.Message.CompletedSaveTheme()),
    ),
  ),
)

const foldSettingsOutMessage = ApplicationDefinition.makeOutMessageFold(
  SettingsDemo,
  {
    ChangedTheme:
      ({ theme }) =>
      model => ({
        model: modifyFields(model, { previewTheme: () => theme }),
      }),
  },
)

export const SettingsBinding = ApplicationDefinition.bindChild(SettingsDemo, {
  field: 'settings',
  outMessage: { fold: foldSettingsOutMessage },
})
