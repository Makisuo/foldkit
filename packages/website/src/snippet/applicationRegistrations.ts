import { ApplicationDefinition } from '../definition'
import { Message } from '../message'
import { Home, Products } from '../page'

export const HomeBinding = ApplicationDefinition.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
})

export const ProductsBinding = ApplicationDefinition.bindChild(Products.block, {
  field: 'products',
  parentMessage: Message.GotProductsMessage,
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [HomeBinding, ProductsBinding],
})
