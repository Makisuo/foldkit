import { Update } from 'foldkit'

import { DialogBinding, SettingsBinding } from './composition'
import type { Model } from './model'

export const resetSettings = (model: Model) => SettingsBinding.reset()(model)

export const saveAndClose = (model: Model) =>
  Update.combine(model, [SettingsBinding.save(), DialogBinding.close()])
