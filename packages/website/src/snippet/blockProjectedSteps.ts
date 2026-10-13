import { Update } from 'foldkit'

import { dialog, settings } from './bindings'
import type { Model } from './model'

export const resetSettings = (model: Model) => settings.reset()(model)

export const saveAndClose = (model: Model) =>
  Update.combine(model, [settings.save(), dialog.close()])
