import { LoginComposition } from './composition'
import { EffectsLayer, initModel, update } from './login'
import { view } from './view'

export const block = LoginComposition.makeBlock({
  init: LoginComposition.makeInit(() => ({ model: initModel() })),
  update,
  view,
  EffectsLayer,
})
