import { Update } from 'foldkit'
import { UrlRequest } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'
import { toString as urlToString } from 'foldkit/url'

import {
  ApplicationComposition,
  LoadExternal,
  NavigateInternal,
  ui,
} from './application'
import { Message } from './message'
import { urlToApplicationRoute } from './route'

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

    ChangedUrl: ({ url }) =>
      Update.combine(model, [
        stepModel => ({
          model: modifyFields(stepModel, {
            route: () => urlToApplicationRoute(url),
          }),
        }),
        ui.closeMobileMenu(),
      ]),

    ClickedOpenMobileMenu: () => ui.openMobileMenu()(model),

    GotUiMessage: ({ message }) => ui.fold(model, message),
  }),
)
