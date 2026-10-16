import { LoginComposition } from './definition'
import { EffectsLayer, initModel, update } from './login'
import { view } from './view'

export const block = LoginComposition.toBlock({
  init: LoginComposition.init(() => ({ model: initModel() })),
  update,
  view,
  EffectsLayer,
})
