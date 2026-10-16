import { Option } from 'effect'
import { Url } from 'foldkit'

import { ApplicationComposition } from './composition'
import { Application } from './definition'
import { ApplicationRoute, urlToApplicationRoute } from './route'
import { initializeRoom } from './update/changeRoute'

export const init = ApplicationComposition.init((url: Url.Url) => {
  const route = urlToApplicationRoute(url)

  return {
    model: {
      route,
      maybeRoomInstance: Option.none(),
    },
    steps: ApplicationRoute.matchOrElse(
      route,
      {
        Room: ({ roomId }) => [
          Application.step(model => initializeRoom(model, roomId)),
        ],
      },
      () => [],
    ),
  }
})
