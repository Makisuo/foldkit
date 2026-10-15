import type { Url } from 'foldkit/url'

import { products } from './data/products'
import { Application } from './definition'
import { Products } from './page'
import { urlToApplicationRoute } from './route'

export const init = Application.init((url: Url) => {
  return {
    model: {
      route: urlToApplicationRoute(url),
      cart: [],
      deliveryInstructions: '',
      orderPlaced: false,
      productsPage: Products.init(products).model,
    },
  }
})
