import { ComingFromReact } from './block'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = ComingFromReact.assemble({ init, update, view })
