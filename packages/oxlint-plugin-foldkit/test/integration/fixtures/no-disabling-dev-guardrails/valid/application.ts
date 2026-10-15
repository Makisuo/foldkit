import { defineApplication } from 'foldkit'

import { init, Message, Model, update, view } from './implementation'

const Application = defineApplication({ Model, Message })

export const application = Application.toComposition().toApplication({ init, update, view })

export const makeLocal = (Application: {
  make: (config: unknown) => unknown
}) => Application.toComposition().toApplication({ freezeModel: false })
