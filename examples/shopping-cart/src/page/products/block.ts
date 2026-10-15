import { Products } from './definition'
import { ReplaceSearchUrl, init, update } from './products'
import { view } from './view'

export const block = Products.toComposition().toBlock({
  init,
  update,
  view,
  EffectsLayer: ReplaceSearchUrl.layer,
})
