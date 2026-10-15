import {
  EffectsLayer,
  PlaygroundComposition,
  informSupport,
  init,
  managedResources,
  update,
  view,
} from './playground'

export const block = PlaygroundComposition.toBlock({
  init,
  update,
  view,
  managedResources,
  EffectsLayer,
  expose: { informSupport },
})
