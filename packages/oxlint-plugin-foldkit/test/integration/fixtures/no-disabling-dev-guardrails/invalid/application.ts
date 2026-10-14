import { define as defineApplication } from 'foldkit/application'

import { init, Message, Model, update, view } from './implementation'

const Application = defineApplication({ Model, Message })
const ApplicationComposition = Application.toComposition({})

export const application = Application.make({
  init,
  update,
  view,
  freezeModel: false,
})

export const registeredApplication = ApplicationComposition.make({
  init,
  update,
  view,
  slow: false,
})
