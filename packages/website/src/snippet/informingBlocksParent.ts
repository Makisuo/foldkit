import { Match } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

const setRoute =
  (nextRoute: ApplicationRoute): Update.Step<Model, Message> =>
  model => ({ model: modifyFields(model, { route: () => nextRoute }) })

export const update = definition.update((model, message) =>
  Message.match(message, {
    ChangedUrl: ({ url }) => {
      const nextRoute = urlToApplicationRoute(url)
      const routeSteps = Match.value(nextRoute).pipe(
        Match.withReturnType<ReadonlyArray<Update.Step<Model, Message>>>(),
        Match.tag('People', peopleRoute => [
          people.informRouteChanged(peopleRoute),
        ]),
        Match.orElse(() => []),
      )

      return Update.combine(model, [setRoute(nextRoute), ...routeSteps])
    },
    GotPeopleMessage: ({ message }) => people.fold(model, message),
  }),
)
