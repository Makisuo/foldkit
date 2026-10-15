import { ApplicationComposition } from './application'

const view = ApplicationComposition.view((model, h) => {
  const routeContent = ApplicationRoute.match(model.route, {
    Products: () => productsView(model, h),
    Cart: () => cartView(model, h),
    Checkout: () => checkoutView(model, h),
    NotFound: ({ path }) => notFoundView(path, h),
  })

  return {
    title: `${model.route._tag} | Shop`,
    body: h.div(
      [],
      [
        h.header([], [navigationView(model.route, h)]),
        h.main([], [routeContent]),
      ],
    ),
  }
})
