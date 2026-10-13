import { define as defineApplication } from 'foldkit/application'

import { init, Message, Model, update, view } from './implementation'

const Application = defineApplication({ Model, Message })

export const application = Application.make({ init, update, view })

export const makeLocal = (Application: {
  make: (config: unknown) => unknown
}) => Application.make({ freezeModel: false })
