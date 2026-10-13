import { Url } from 'foldkit'

import { home, room } from './children'
import { Model } from './model'
import { ApplicationRoute, urlToApplicationRoute } from './route'

export const init = (url: Url.Url) => {
  const route = urlToApplicationRoute(url)

  const homeInit = home.init()
  const roomInit = room.init(route)

  const commands = ApplicationRoute.match(route, {
    Home: () => homeInit.commands ?? [],
    Room: () => roomInit.commands ?? [],
    NotFound: () => [],
  })

  const model = Model.make({
    route,
    home: homeInit.model,
    room: roomInit.model,
  })
  return { model, commands }
}
