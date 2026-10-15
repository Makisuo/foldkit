import { Application } from './definition'
import type { Model } from './model'

export const initialModel: Model = { uploadId: 0, uploads: [] }

export const init = Application.init(() => ({ model: initialModel }))
