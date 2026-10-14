import { Option, String } from 'effect'
import { UrlRequest } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'
import { type Url, toString as urlToString } from 'foldkit/url'

import { ApplicationComposition } from './application'
import { dietListbox, periodListbox } from './childBindings'
import { LoadExternal, NavigateInternal, ReplaceFilters } from './command'
import { Message } from './message'
import { DietListbox, PeriodListbox } from './model'
import {
  nextSorting,
  routeToBrowseFields,
  urlToApplicationRoute,
} from './route'

export const init = (url: Url) => {
  const route = urlToApplicationRoute(url)

  return {
    model: {
      route,
      dietListbox: DietListbox.init({ id: 'diet-filter' }).model,
      periodListbox: PeriodListbox.init({ id: 'period-filter' }).model,
    },
  }
}
export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),
    CompletedReplaceFilters: () => ({ model }),

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

      return { model: modifyFields(model, { route: () => nextRoute }) }
    },

    ChangedSearchInput: ({ value }) => {
      const fields = routeToBrowseFields(model.route)

      return {
        model,
        commands: [
          ReplaceFilters({
            ...fields,
            search: Option.liftPredicate(value, String.isNonEmpty),
          }),
        ],
      }
    },

    ClickedColumnHeader: ({ column }) => {
      const fields = routeToBrowseFields(model.route)

      return {
        model,
        commands: [
          ReplaceFilters({
            ...fields,
            sorting: nextSorting(fields.sorting, column),
          }),
        ],
      }
    },

    GotDietListboxMessage: ({ message }) => dietListbox.fold(model, message),

    GotPeriodListboxMessage: ({ message }) =>
      periodListbox.fold(model, message),
  }),
)
