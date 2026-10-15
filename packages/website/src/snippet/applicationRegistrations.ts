import { Application } from '../definition'
import { Message } from '../message'
import { Home, Products } from '../page'

export const home = Application.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
})

export const products = Application.bindChild(Products.block, {
  field: 'products',
  parentMessage: Message.GotProductsMessage,
})

export const ApplicationComposition = Application.toComposition({
  children: [home, products],
})
