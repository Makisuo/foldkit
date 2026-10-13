import { BlockPage } from './block'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = BlockPage.assemble({ init, update, view })
