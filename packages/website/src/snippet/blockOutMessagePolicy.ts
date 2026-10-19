import { modifyFields } from 'foldkit/struct'

import { ApplicationDefinition } from './blockProfileContract'
import * as Settings from './blockSettings'

const foldSettingsOutMessage = ApplicationDefinition.makeOutMessageFold(
  Settings.SettingsBlock,
  {
    ChangedTheme:
      ({ theme }) =>
      model => ({
        model: modifyFields(model, { previewTheme: () => theme }),
      }),
  },
)

export const SettingsBinding = ApplicationDefinition.bindChild(
  Settings.SettingsBlock,
  {
    field: 'settings',
    outMessage: { fold: foldSettingsOutMessage },
  },
)
