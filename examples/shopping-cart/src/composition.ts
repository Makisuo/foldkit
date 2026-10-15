import { Update } from 'foldkit'
import type { Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Application } from './definition'
import { Cart } from './domain'
import { Message } from './message'
import type { Model } from './model'
import { Products } from './page'

const foldProductsOutMessage = Products.OutMessage.match<
  Update.Step<Model, Message>
>({
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
})

export const productsPage = Application.bindChild(Products.block, {
  field: 'productsPage',
  parentMessage: Message.GotProductsMessage,
  outMessage: { fold: foldProductsOutMessage },
})

export const ApplicationComposition = Application.toComposition({
  children: [productsPage],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
