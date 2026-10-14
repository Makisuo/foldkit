import { Match, Schema } from 'effect'
import { Update } from 'foldkit'
import { define as defineApplication } from 'foldkit/application'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'
import { Url } from 'foldkit/url'

import * as People from './informingBlocksIndex'
import { ApplicationRoute, urlToApplicationRoute } from './informingBlocksRoute'

export const Model = Schema.Struct({
  route: ApplicationRoute,
  people: People.Model,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ChangedUrl: { url: Url },
  GotPeopleMessage: { message: People.Message },
})
export type Message = typeof Message.Type

export const ApplicationDefinition = defineApplication({ Model, Message })

export const people = ApplicationDefinition.bindChild(People.block, {
  field: 'people',
  parentMessage: Message.GotPeopleMessage,
})

export const ApplicationComposition = ApplicationDefinition.toComposition({
  children: [people],
})

const setRoute =
  (nextRoute: ApplicationRoute): Update.Step<Model, Message> =>
  model => ({ model: modifyFields(model, { route: () => nextRoute }) })

export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    ChangedUrl: ({ url }) => {
      const nextRoute = urlToApplicationRoute(url)

      return Match.value(nextRoute).pipe(
        Match.tag('People', peopleRoute =>
          Update.combine(model, [
            setRoute(nextRoute),
            people.informRouteChanged(peopleRoute),
          ]),
        ),
        Match.orElse(() => setRoute(nextRoute)(model)),
      )
    },

    GotPeopleMessage: ({ message }) => people.fold(model, message),
  }),
)
