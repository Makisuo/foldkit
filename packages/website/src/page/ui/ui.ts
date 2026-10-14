import { init } from './init'
import { RegisteredUiDefinition, update } from './update'

export const block = RegisteredUiDefinition.toBlock({
  init,
  update,
})
