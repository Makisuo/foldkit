import { Login } from './definition'
import { EffectsLayer, initModel, update } from './login'
import { view } from './view'

export const block = Login.toComposition().toBlock({
  init: () => ({ model: initModel() }),
  update,
  view,
  EffectsLayer,
})
