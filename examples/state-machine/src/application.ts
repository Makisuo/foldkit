import { EffectsLayer, init, update } from './stateMachine'
import { view } from './view'

export const implementation = {
  init,
  update,
  view,
  EffectsLayer,
}

export * from './stateMachine'
