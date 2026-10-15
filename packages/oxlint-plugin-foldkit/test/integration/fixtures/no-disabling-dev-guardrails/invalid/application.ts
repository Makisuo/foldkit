import { defineApplication } from 'foldkit'

import { init, Message, Model, update, view } from './implementation'

const Application = defineApplication({ Model, Message })
const ApplicationComposition = Application.toComposition({})

export const application = Application.toComposition().toApplication({
  init,
  update,
  view,
  freezeModel: false,
})

export const registeredApplication = ApplicationComposition.toApplication({
  init,
  update,
  view,
  slow: false,
})
