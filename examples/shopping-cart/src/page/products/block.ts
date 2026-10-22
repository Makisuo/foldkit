import { Block } from 'foldkit'

import { ProductsComposition } from './composition'
import type { Model } from './definition'
import { ReplaceSearchUrl, init, update } from './products'
import { view } from './view'

const assemble = () =>
  ProductsComposition.assembleBlock({
    init,
    update,
    view,
    EffectsLayer: ReplaceSearchUrl.layer,
  })
export const ProductsBlock: Block.FromAssemblyWithViewAndOutMessage<
  typeof Model,
  typeof assemble
> = Block.complete(assemble)
