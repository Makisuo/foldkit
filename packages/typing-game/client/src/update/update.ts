import { Url } from 'foldkit'
import { UrlRequest } from 'foldkit/navigation'

import { ApplicationComposition, home, room } from '../application'
import { LoadExternal, NavigateInternal } from '../command'
import { Message } from '../message'
import { ApplicationRoute } from '../route'
import { changeRoute } from './changeRoute'

export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    ClickedLink: ({ request }) =>
      UrlRequest.match(request, {
        Internal: ({ url }) => ({
          model,
          commands: [NavigateInternal({ url: Url.toString(url) })],
        }),
        External: ({ href }) => ({
          model,
          commands: [LoadExternal({ href })],
        }),
      }),
    ChangedUrl: ({ url }) => changeRoute(model, url),
    GotHomeMessage: ({ message }) =>
      ApplicationRoute.match(model.route, {
        Home: () => home.fold(model, message),
        Room: () => ({ model }),
        NotFound: () => ({ model }),
      }),
    GotRoomMessage: ({ roomId, message }) =>
      ApplicationRoute.match(model.route, {
        Home: () => ({ model }),
        Room: route =>
          route.roomId === roomId
            ? room.fold(model, roomId, message, { roomId })
            : { model },
        NotFound: () => ({ model }),
      }),
    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),
    CompletedNavigateToRoom: () => ({ model }),
  }),
)
