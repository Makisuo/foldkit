import { ComingFromReactDefinition } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = ComingFromReactDefinition.toBlock({ init, update, view })
