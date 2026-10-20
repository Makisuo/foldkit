import type { Block } from 'foldkit'

import { products } from './data/products'
import { ApplicationDefinition } from './definition'
import { Cart } from './domain'
import { ProductsBlock } from './page'

export const ProductsPageBinding = ApplicationDefinition.bindChild(
  ProductsBlock,
  {
    field: 'productsPage',
    init: { contextToArgs: () => [products] },
  },
).withOutMessagePolicy({
  fold: ApplicationDefinition.makeOutMessageFold(ProductsBlock, {
    AddedToCart: ({ item }) =>
      ApplicationDefinition.stepFields(() => ({ cart: Cart.addItem(item) })),
    IncrementedQuantity: ({ itemId }) =>
      ApplicationDefinition.stepFields(() => ({
        cart: Cart.incrementQuantity(itemId),
      })),
    DecrementedQuantity: ({ itemId }) =>
      ApplicationDefinition.stepFields(() => ({
        cart: Cart.decrementQuantity(itemId),
      })),
  }),
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  bindings: [ProductsPageBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
