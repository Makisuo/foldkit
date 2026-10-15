import { Option } from 'effect'
import { Url } from 'foldkit'

import { home, room } from './composition'
import { Application } from './definition'
import { Model, RoomInstance } from './model'
import { ApplicationRoute, urlToApplicationRoute } from './route'

export const init = Application.init((url: Url.Url) => {
  const route = urlToApplicationRoute(url)
  const homeInit = home.init()

  return ApplicationRoute.match(route, {
    Home: () => ({
      model: Model.make({
        route,
        home: homeInit.model,
        maybeRoomInstance: Option.none(),
      }),
      commands: homeInit.commands,
    }),
    Room: ({ roomId }) => {
      const roomInit = room.init(roomId, Option.some(roomId))

      return {
        model: Model.make({
          route,
          home: homeInit.model,
          maybeRoomInstance: Option.some(
            RoomInstance.make({ roomId, model: roomInit.model }),
          ),
        }),
        commands: roomInit.commands,
      }
    },
    NotFound: () => ({
      model: Model.make({
        route,
        home: homeInit.model,
        maybeRoomInstance: Option.none(),
      }),
    }),
  })
})
