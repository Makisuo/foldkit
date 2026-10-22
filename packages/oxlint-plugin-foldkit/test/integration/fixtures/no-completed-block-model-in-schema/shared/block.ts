import { Block } from 'foldkit'

import { ChildComposition as Composition } from './composition'

const assemble = () =>
  Composition.assembleBlock({
    init: () => ({ model: { count: 0 } }),
    update: model => ({ model }),
  })
const completed = Block.complete(assemble)
export { completed as ChildBlock }
