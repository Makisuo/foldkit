import { Schema } from 'effect'
import { defineApplication } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { UrlRequest } from 'foldkit/navigation'
import { Url } from 'foldkit/url'

import { Cart } from './domain'
import * as Products from './page/products/definition'
import { ApplicationRoute } from './route'

export const Model = Schema.Struct({
  route: ApplicationRoute,
  cart: Cart.Cart,
  deliveryInstructions: Schema.String,
  orderPlaced: Schema.Boolean,
  productsPage: Products.Model,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  CompletedNavigateInternal: {},
  CompletedLoadExternal: {},
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  GotProductsMessage: { message: Products.Message },
  ClickedIncrementQuantity: { itemId: Schema.String },
  ClickedDecrementQuantity: { itemId: Schema.String },
  ClickedRemoveCartItem: { itemId: Schema.String },
  ClickedClearCart: {},
  UpdatedDeliveryInstructions: { value: Schema.String },
  ClickedPlaceOrder: {},
})

export type Message = typeof Message.Type

export const Application = defineApplication({ Model, Message })
