import {
  AsyncCounterDemoComposition,
  EffectsLayer,
  init,
  update,
  view,
} from './asyncCounterDemo'

export const block = AsyncCounterDemoComposition.toBlock({
  init,
  update,
  view,
  EffectsLayer,
})
