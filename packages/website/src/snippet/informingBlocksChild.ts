import { modifyFields } from 'foldkit/struct'

import { FetchPeople } from './informingBlocksCommand'
import { PeopleDefinition } from './informingBlocksDefinition'
import { init } from './informingBlocksInit'
import { Message } from './informingBlocksMessage'
import {
  SearchResults,
  addSearchToHistory,
  routeSearchText,
} from './informingBlocksModel'
import { type PeopleRoute } from './informingBlocksRoute'

export const update = PeopleDefinition.update((model, message) =>
  Message.match(message, {
    ChangedRoute: ({ route }) => {
      const searchText = routeSearchText(route.searchText)
      return {
        model: modifyFields(model, {
          searchInput: () => searchText,
          searchHistory: history => addSearchToHistory(history, searchText),
          results: () => SearchResults.Loading(),
        }),
        commands: [FetchPeople({ searchText })],
      }
    },

    CompletedFetchPeople: ({ query, people }) => ({
      model: modifyFields(model, {
        results: () => SearchResults.Loaded({ query, people }),
      }),
    }),
  }),
)

export const informRouteChanged = PeopleDefinition.step(
  (model, route: PeopleRoute) => update(model, Message.ChangedRoute({ route })),
)

export const block = PeopleDefinition.toComposition().toBlock({
  init,
  update,
  expose: { informRouteChanged },
  EffectsLayer: FetchPeople.layer,
})
