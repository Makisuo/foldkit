import { define as defineApplication } from 'foldkit/application'

import { init, Message, Model, update, view } from './implementation'

const ApplicationDefinition = defineApplication({ Model, Message })

export const application = ApplicationDefinition.make({ init, update, view })

export const makeLocal = (Application: {
  make: (config: unknown) => unknown
}) => Application.make({ freezeModel: false })
