import { defineApplication } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { Home, Products } from './page'

export const Application = defineApplication({ Model, Message })

const home = Application.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
})

const products = Application.bindChild(Products.block, {
  field: 'products',
  parentMessage: Message.GotProductsMessage,
})

export const ApplicationComposition = Application.toComposition({
  children: [home, products],
})
