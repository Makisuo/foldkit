import { Effect, Layer, Match, Option, Schema } from 'effect'
import { Update } from 'foldkit'
import type { Block } from 'foldkit'
import { Html } from 'foldkit/html'
import { UrlRequest, load, pushUrl } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'
import { type Url, toString as urlToString } from 'foldkit/url'

import { products } from './data/products'
import { Application, Message, type Model } from './definition'
import { Cart } from './domain'
import { Cart as CartPage, Checkout, Products } from './page'
import {
  ApplicationRoute,
  cartRouter,
  checkoutRouter,
  productsRouter,
  urlToApplicationRoute,
} from './route'

export const init = (url: Url) => {
  return {
    model: {
      route: urlToApplicationRoute(url),
      cart: [],
      deliveryInstructions: '',
      orderPlaced: false,
      productsPage: Products.init(products).model,
    },
  }
}

const NavigateInternal = Application.command('NavigateInternal', {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigateInternal],
  handler: function* () {
    return ({ url }) =>
      pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal()))
  },
})

const LoadExternal = Application.command('LoadExternal', {
  args: { href: Schema.String },
  messages: [Message.CompletedLoadExternal],
  handler: function* () {
    return ({ href }) =>
      load(href).pipe(Effect.as(Message.CompletedLoadExternal()))
  },
})

export const EffectsLayer = Layer.mergeAll(
  NavigateInternal.layer,
  LoadExternal.layer,
)

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

export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),

    ClickedLink: ({ request }) =>
      UrlRequest.match(request, {
        Internal: ({ url }) => ({
          model,
          commands: [NavigateInternal({ url: urlToString(url) })],
        }),

        External: ({ href }) => ({
          model,
          commands: [LoadExternal({ href })],
        }),
      }),

    ChangedUrl: ({ url }) => ({
      model: modifyFields(model, {
        route: () => urlToApplicationRoute(url),
      }),
    }),

    GotProductsMessage: ({ message }) => productsPage.fold(model, message),

    ClickedIncrementQuantity: ({ itemId }) => ({
      model: modifyFields(model, {
        cart: Cart.incrementQuantity(itemId),
      }),
    }),

    ClickedDecrementQuantity: ({ itemId }) => ({
      model: modifyFields(model, {
        cart: Cart.decrementQuantity(itemId),
      }),
    }),

    ClickedRemoveCartItem: ({ itemId }) => ({
      model: modifyFields(model, {
        cart: Cart.removeItem(itemId),
      }),
    }),

    ClickedClearCart: () => ({
      model: modifyFields(model, {
        cart: () => [],
      }),
    }),

    UpdatedDeliveryInstructions: ({ value }) => ({
      model: modifyFields(model, {
        deliveryInstructions: () => value,
      }),
    }),

    ClickedPlaceOrder: () => ({
      model: modifyFields(model, {
        orderPlaced: () => true,
        cart: () => [],
        deliveryInstructions: () => '',
      }),
    }),
  }),
)

type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>

const navigationView = (
  currentRoute: ApplicationRoute,
  cartCount: number,
  h: ViewBuilder,
): Html => {
  const navLinkClassName = (isActive: boolean) =>
    `hover:bg-blue-600 font-medium px-3 py-1 rounded transition ${isActive ? 'bg-blue-700 bg-opacity-50' : ''}`

  return h.nav(
    [h.Class('bg-blue-500 text-white p-4 mb-6')],
    [
      h.ul(
        [h.Class('max-w-6xl mx-auto flex gap-6 justify-center list-none')],
        [
          h.li(
            [],
            [
              h.a(
                [
                  h.Href(productsRouter({ searchText: Option.none() })),
                  h.Class(navLinkClassName(currentRoute._tag === 'Products')),
                ],
                ['Products'],
              ),
            ],
          ),
          h.li(
            [],
            [
              h.a(
                [
                  h.Href(cartRouter()),
                  h.Class(navLinkClassName(currentRoute._tag === 'Cart')),
                ],
                cartCount > 0 ? [`Cart (${cartCount})`] : ['Cart'],
              ),
            ],
          ),
          h.li(
            [],
            [
              h.a(
                [
                  h.Href(checkoutRouter()),
                  h.Class(navLinkClassName(currentRoute._tag === 'Checkout')),
                ],
                ['Checkout'],
              ),
            ],
          ),
        ],
      ),
    ],
  )
}

const productsView = (model: Model, h: ViewBuilder): Html =>
  h.block(
    productsPage.embedView({
      slotId: 'products',
      model: model.productsPage,
      viewInputs: { cart: model.cart },
    }),
  )

const cartView = (model: Model, h: ViewBuilder): Html =>
  CartPage.view(model.cart, h)

const checkoutView = (model: Model, h: ViewBuilder): Html =>
  Checkout.view(model.cart, model.deliveryInstructions, model.orderPlaced, h)

const notFoundView = (path: string, h: ViewBuilder): Html =>
  h.div(
    [h.Class('max-w-4xl mx-auto px-4 text-center')],
    [
      h.h1(
        [h.Class('text-4xl font-bold text-red-600 mb-6')],
        ['404 - Page Not Found'],
      ),
      h.p(
        [h.Class('text-lg text-gray-600 mb-4')],
        [`The path "${path}" was not found.`],
      ),
      h.a(
        [
          h.Href(productsRouter({ searchText: Option.none() })),
          h.Class('text-blue-500 hover:underline'),
        ],
        ['← Go to Products'],
      ),
    ],
  )

const routeTitle = (route: Model['route']): string =>
  Match.value(route).pipe(
    Match.tag('Products', () => 'Shopping Cart'),
    Match.orElse(({ _tag }) => `${_tag} | Shopping Cart`),
  )

export const view = ApplicationComposition.view((model, h) => {
  const routeContent = ApplicationRoute.match(model.route, {
    Products: () => productsView(model, h),
    Cart: () => cartView(model, h),
    Checkout: () => checkoutView(model, h),
    NotFound: ({ path }) => notFoundView(path, h),
  })

  return {
    title: routeTitle(model.route),
    body: h.div(
      [h.Class('min-h-screen bg-gray-100')],
      [
        h.header(
          [],
          [navigationView(model.route, Cart.totalItems(model.cart), h)],
        ),
        h.main([h.Class('py-8')], [routeContent]),
      ],
    ),
  }
})
