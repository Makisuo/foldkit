import { PlaygroundComposition } from './composition'
import { Message } from './definition'
import {
  EffectsLayer,
  init,
  managedResources,
  update,
  view,
} from './playground'

export const block = PlaygroundComposition.makeBlock({
  init,
  update,
  view,
  managedResources,
  EffectsLayer,
  operations: { informSupport: Message.InformedOfSupport },
})
