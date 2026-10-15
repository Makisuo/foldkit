import type { Url } from 'foldkit/url'

import { ui } from './composition'
import { Application } from './definition'
import type { Flags } from './flags'
import { Model } from './model'
import { urlToApplicationRoute } from './route'

export const init = Application.init((flags: Flags, url: Url) => {
  const uiInit = ui.init(flags.today)

  return {
    model: Model.make({
      route: urlToApplicationRoute(url),
      uiModel: uiInit.model,
    }),
    commands: uiInit.commands,
  }
})
