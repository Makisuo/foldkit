import { Url } from 'foldkit/url'

import { ApplicationComposition } from './composition'
import * as Route from './route'

export const init = ApplicationComposition.init((url: Url) => ({
  model: {
    route: Route.urlToApplicationRoute(url),
  },
}))
