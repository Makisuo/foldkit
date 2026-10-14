import { define as defineApplication } from 'foldkit/application'

import { init, Message, Model, update, view } from './implementation'

const ApplicationDefinition = defineApplication({ Model, Message })
const Application = ApplicationDefinition.register({})

export const application = ApplicationDefinition.make({
  init,
  update,
  view,
  freezeModel: false,
})

export const registeredApplication = Application.make({
  init,
  update,
  view,
  slow: false,
})
