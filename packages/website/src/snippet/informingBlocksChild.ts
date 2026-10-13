import { Option, Schema, String } from 'effect'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { People } from './block'
import { FetchPeople, PushSearchUrl } from './command'
import { init } from './init'
import { EffectsLayer } from './layer'
import { Model } from './model'
import { PeopleRoute } from './route'

// MESSAGE

const Person = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  role: Schema.String,
})

export const Message = defineMessageUnion({
  ChangedSearchInput: { value: Schema.String },
  SubmittedSearch: {},
  ChangedRoute: { route: PeopleRoute },
  SucceededFetchPeople: {
    query: Schema.String,
    people: Schema.Array(Person),
  },
})
export type Message = typeof Message.Type

// UPDATE

const people = People.define({ Model, Message })

export const update = people.update((model, message) =>
  Message.match(message, {
    ChangedSearchInput: ({ value }) => ({
      model: modifyFields(model, { searchInput: () => value }),
    }),

    SubmittedSearch: () => ({
      model,
      commands: [
        PushSearchUrl({
          searchText: Option.liftPredicate(
            model.searchInput,
            String.isNonEmpty,
          ),
        }),
      ],
    }),

    ChangedRoute: ({ route }) => {
      const searchText = Option.getOrElse(route.searchText, () => '')
      return {
        model: modifyFields(model, {
          searchInput: () => searchText,
          searchHistory: searchHistory =>
            addSearchToHistory(searchHistory, searchText),
          results: () => SearchLoading(),
        }),
        commands: [FetchPeople({ searchText })],
      }
    },

    SucceededFetchPeople: ({ query, people }) => ({
      model: modifyFields(model, {
        results: () => SearchLoaded({ query, people }),
      }),
    }),
  }),
)

export const informRouteChanged = people.step(
  (model: Model, route: PeopleRoute) =>
    update(model, Message.ChangedRoute({ route })),
)

export const block = people.assemble({
  init,
  update,
  steps: { informRouteChanged },
  EffectsLayer,
})
