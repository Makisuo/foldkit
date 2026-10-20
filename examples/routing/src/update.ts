import { Match, Option } from 'effect'
import { Update } from 'foldkit'
import { UrlRequest } from 'foldkit/navigation'
import { toString as urlToString } from 'foldkit/url'

import { LoadExternal, NavigateInternal } from './command'
import { ApplicationComposition, PeoplePageBinding } from './composition'
import { ApplicationDefinition } from './definition'
import { Message, type NavigationShortcut } from './message'
import {
  ApplicationRoute,
  filesIndexRouter,
  homeRouter,
  nestedRouter,
  peopleRouter,
  urlToApplicationRoute,
} from './route'

const navigationUrlByShortcut: Readonly<
  Record<typeof NavigationShortcut.Type, () => string>
> = {
  GH: homeRouter,
  GP: () => peopleRouter({ searchText: Option.none() }),
  GF: filesIndexRouter,
  GN: nestedRouter,
}

const setRoute = (nextRoute: typeof ApplicationRoute.Type) =>
  ApplicationDefinition.makeFieldsStep(() => ({ route: () => nextRoute }))

export const update = ApplicationComposition.makeUpdate((model, message) =>
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
          PeoplePageBinding.informRouteChanged({ route: peopleRoute }),
        ]),
        Match.orElse(() => []),
      )

      return Update.combineSteps(model, [setRoute(nextRoute), ...routeSteps])
    },

    EnteredNavigationShortcut: ({ shortcut }) => {
      const url = navigationUrlByShortcut[shortcut]()

      return { model, commands: [NavigateInternal({ url })] }
    },
  }),
)
