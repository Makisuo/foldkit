import { Option } from 'effect'
import { Url } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { room } from '../application'
import { type Model, RoomInstance } from '../model'
import { ApplicationRoute, urlToApplicationRoute } from '../route'

const initializeRoom = (model: Model, roomId: string) => {
  const roomInit = room.init(roomId, Option.some(roomId))

  return {
    model: modifyFields(model, {
      maybeRoomInstance: () =>
        Option.some(RoomInstance.make({ roomId, model: roomInit.model })),
    }),
    commands: roomInit.commands,
  }
}

export const changeRoute = (model: Model, url: Url.Url) => {
  const route = urlToApplicationRoute(url)
  const routeChanged = modifyFields(model, { route: () => route })

  return ApplicationRoute.match(route, {
    Home: () => ({
      model: modifyFields(routeChanged, {
        maybeRoomInstance: () => Option.none(),
      }),
    }),
    Room: ({ roomId }) =>
      Option.match(model.maybeRoomInstance, {
        onNone: () => initializeRoom(routeChanged, roomId),
        onSome: roomInstance =>
          roomInstance.roomId === roomId
            ? { model: routeChanged }
            : initializeRoom(routeChanged, roomId),
      }),
    NotFound: () => ({
      model: modifyFields(routeChanged, {
        maybeRoomInstance: () => Option.none(),
      }),
    }),
  })
}
