import type { Url } from 'foldkit/url'

import { ApplicationComposition } from './composition'
import type { Flags } from './flags'
import { urlToApplicationRoute } from './route'

export const init = ApplicationComposition.init((flags: Flags, url: Url) => ({
  startup: flags,
  model: {
    route: urlToApplicationRoute(url),
  },
}))
