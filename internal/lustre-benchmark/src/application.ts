import { define as defineApplication } from 'foldkit/application'

import { Model, Message, init, update as update_, view as view_ } from './todo'

export const Application = defineApplication({ Model, Message })
export const ApplicationComposition = Application.toComposition()
export const update = Application.update(update_)
export const view = ApplicationComposition.view(view_)
export { init }
