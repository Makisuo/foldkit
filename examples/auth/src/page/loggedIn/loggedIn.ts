import { LoggedInDefinition } from './definition'
import { init } from './model'
import { update } from './update'
import { view } from './view'

export const block = LoggedInDefinition.toBlock({
  init: (...args: Parameters<typeof init>) => ({ model: init(...args) }),
  update,
  view,
})
