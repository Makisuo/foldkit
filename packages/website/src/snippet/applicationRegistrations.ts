import { define as defineApplication } from 'foldkit/application'

import { Message } from './message'
import { Model } from './model'
import { Home, Products } from './page'

export const ApplicationDefinition = defineApplication({ Model, Message })

const home = ApplicationDefinition.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
})

const products = ApplicationDefinition.bindChild(Products.block, {
  field: 'products',
  parentMessage: Message.GotProductsMessage,
})

export const ApplicationComposition = ApplicationDefinition.toComposition({
  children: [home, products],
})
