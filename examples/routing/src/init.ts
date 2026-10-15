import { Match, Option } from 'effect'
import type { Url } from 'foldkit/url'

import { peoplePage } from './composition'
import { Application } from './definition'
import { Model } from './model'
import { ApplicationRoute, urlToApplicationRoute } from './route'

export const init = Application.init((url: Url) => {
  const route = urlToApplicationRoute(url)

  const initialPeopleRoute = Match.value(route).pipe(
    Match.tag('People', peopleRoute => peopleRoute),
    Match.orElse(() => ApplicationRoute.People({ searchText: Option.none() })),
  )

  const peopleInit = peoplePage.init(initialPeopleRoute)

  return {
    model: Model.make({ route, peoplePage: peopleInit.model }),
    commands: peopleInit.commands,
  }
})
