import { ApplicationDefinition } from './blockProfileContract'
import * as Settings from './blockSettings'

export const SettingsBinding = ApplicationDefinition.bindChild(
  Settings.SettingsBlock,
  {
    field: 'settings',
  },
).withOutMessagePolicy({
  fold: ApplicationDefinition.makeOutMessageFold(Settings.SettingsBlock, {
    ChangedTheme: ({ theme }) =>
      ApplicationDefinition.stepFields(() => ({ previewTheme: () => theme })),
  }),
})
