import { define as defineApplication } from 'foldkit/application'

import { Message } from './message'
import { Model } from './model'
import { Home, Products } from './page'

const home = Home.block.connection({
  Model,
  field: 'home',
  parentMessage: Message.GotHomeMessage,
})

const products = Products.block.connection({
  Model,
  field: 'products',
  parentMessage: Message.GotProductsMessage,
})

export const ApplicationDefinition = defineApplication({ Model, Message })

export const Application = ApplicationDefinition.register({
  children: [home, products],
})
