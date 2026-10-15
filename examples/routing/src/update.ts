import { Match, Option } from 'effect'
import { Update } from 'foldkit'
import { UrlRequest } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'
import { type Url, toString as urlToString } from 'foldkit/url'

import { ApplicationComposition, peoplePage } from './application'
import { LoadExternal, NavigateInternal } from './command'
import { Message, type NavigationShortcut } from './message'
import { Model } from './model'
import {
  ApplicationRoute,
  filesIndexRouter,
  homeRouter,
  nestedRouter,
  peopleRouter,
  urlToApplicationRoute,
} from './route'

export const init = (url: Url) => {
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
}

const navigationUrlByShortcut: Readonly<
  Record<NavigationShortcut, () => string>
> = {
  GH: homeRouter,
  GP: () => peopleRouter({ searchText: Option.none() }),
  GF: filesIndexRouter,
  GN: nestedRouter,
}

const setRoute = (nextRoute: ApplicationRoute) => (model: Model) => ({
  model: modifyFields(model, { route: () => nextRoute }),
})

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

    ChangedUrl: ({ url }) => {
      const nextRoute = urlToApplicationRoute(url)

      const routeSteps = Match.value(nextRoute).pipe(
        Match.tag('People', peopleRoute => [
          peoplePage.informRouteChanged(peopleRoute),
        ]),
        Match.orElse(() => []),
      )

      return Update.combine(model, [setRoute(nextRoute), ...routeSteps])
    },

    EnteredNavigationShortcut: ({ shortcut }) => {
      const url = navigationUrlByShortcut[shortcut]()

      return { model, commands: [NavigateInternal({ url })] }
    },

    GotPeopleMessage: ({ message }) => peoplePage.fold(model, message),
  }),
)
