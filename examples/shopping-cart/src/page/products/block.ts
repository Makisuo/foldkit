import type { Block } from 'foldkit'

import { ProductsComposition } from './composition'
import type { Model } from './definition'
import { ReplaceSearchUrl, init, update } from './products'
import { view } from './view'

const assembleProductsBlock = () =>
  ProductsComposition.assembleBlock({
    init,
    update,
    view,
    EffectsLayer: ReplaceSearchUrl.layer,
  })

export const ProductsBlock: Block.FromAssemblyWithViewAndOutMessage<
  typeof Model,
  typeof assembleProductsBlock
> = assembleProductsBlock()
