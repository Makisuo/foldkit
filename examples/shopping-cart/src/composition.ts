import type { Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { products } from './data/products'
import { ApplicationDefinition } from './definition'
import { Cart } from './domain'
import { ProductsBlock } from './page'

const foldProductsOutMessage = ApplicationDefinition.makeOutMessageFold(
  ProductsBlock,
  {
    AddedToCart:
      ({ item }) =>
      model => ({
        model: modifyFields(model, { cart: Cart.addItem(item) }),
      }),
    IncrementedQuantity:
      ({ itemId }) =>
      model => ({
        model: modifyFields(model, { cart: Cart.incrementQuantity(itemId) }),
      }),
    DecrementedQuantity:
      ({ itemId }) =>
      model => ({
        model: modifyFields(model, { cart: Cart.decrementQuantity(itemId) }),
      }),
  },
)

export const ProductsPageBinding = ApplicationDefinition.bindChild(
  ProductsBlock,
  {
    field: 'productsPage',
    init: { contextToArgs: () => [products] },
    outMessage: { fold: foldProductsOutMessage },
  },
)

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  bindings: [ProductsPageBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
