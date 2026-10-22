import { ChildComposition as Composition } from './composition'

const completed = Composition.assembleBlock({
  init: () => ({ model: { count: 0 } }),
  update: model => ({ model }),
})
export { completed as ChildBlock }
