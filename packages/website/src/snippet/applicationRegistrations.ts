import { define as defineApplication } from 'foldkit/application'

import { Message } from './message'
import { Model } from './model'
import * as Home from './page/home'
import * as Products from './page/products'

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

export const Application = defineApplication({ Model, Message }).register({
  children: [home, products],
})
