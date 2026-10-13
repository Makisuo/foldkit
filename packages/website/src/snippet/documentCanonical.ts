import { Schema, String, pipe } from 'effect'
import { Route } from 'foldkit'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { defineRouteUnion, int, literal, slash } from 'foldkit/route'

// ROUTE

const ApplicationRoute = defineRouteUnion({
  Home: {},
  Person: { personId: Schema.Number },
})
type ApplicationRoute = typeof ApplicationRoute.Type

const homeRouter = pipe(Route.root, Route.mapTo(ApplicationRoute.Home))
const personRouter = pipe(
  literal('people'),
  slash(int('personId')),
  Route.mapTo(ApplicationRoute.Person),
)

// CANONICAL

const SITE_URL = 'https://app.example'

const routeToCanonicalUrl = (route: ApplicationRoute): string =>
  String.concat(
    SITE_URL,
    ApplicationRoute.match(route, {
      Home: () => homeRouter(),
      Person: ({ personId }) => personRouter({ personId }),
    }),
  )

// VIEW

const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: pageTitle(model.route),
  canonical: routeToCanonicalUrl(model.route),
  body: h.div([h.Class('mx-auto max-w-prose p-6')], [pageContent(model, h)]),
})
