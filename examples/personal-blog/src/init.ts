import { Url } from 'foldkit/url'

import { counter } from './composition'
import { Application } from './definition'
import * as Route from './route'

export const init = Application.init((url: Url) => ({
  model: {
    route: Route.urlToApplicationRoute(url),
    counter: counter.init().model,
  },
}))
