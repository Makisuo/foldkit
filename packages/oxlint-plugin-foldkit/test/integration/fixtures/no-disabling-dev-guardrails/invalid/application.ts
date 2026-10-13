import { define as defineApplication } from 'foldkit/application'

import { init, Message, Model, update, view } from './implementation'

const Application = defineApplication({ Model, Message })
const RegisteredApplication = Application.register({})

export const application = Application.make({
  init,
  update,
  view,
  freezeModel: false,
})

export const registeredApplication = RegisteredApplication.make({
  init,
  update,
  view,
  slow: false,
})
