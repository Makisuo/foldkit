import { Effect, Layer, Schema } from 'effect'
import type { Block } from 'foldkit'
import { UrlRequest, load, pushUrl } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'
import { Url, toString as urlToString } from 'foldkit/url'

import { Application, Message } from './definition'
import { Counter } from './island'
import * as Route from './route'

export const counter = Application.bindChild(Counter.block, {
  field: 'counter',
  parentMessage: Message.GotCounterMessage,
})

export const ApplicationComposition = Application.toComposition({
  children: [counter],
})
export type ApplicationViewBuilder = Block.HtmlBuilderOf<
  typeof ApplicationComposition
>

export const init = (url: Url) => ({
  model: {
    route: Route.urlToApplicationRoute(url),
    counter: counter.init().model,
  },
})

const NavigateInternal = ApplicationComposition.command('NavigateInternal', {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigateInternal],
  handler: function* () {
    return ({ url }) =>
      pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal()))
  },
})

const LoadExternal = ApplicationComposition.command('LoadExternal', {
  args: { href: Schema.String },
  messages: [Message.CompletedLoadExternal],
  handler: function* () {
    return ({ href }) =>
      load(href).pipe(Effect.as(Message.CompletedLoadExternal()))
  },
})

export const EffectsLayer = Layer.mergeAll(
  NavigateInternal.layer,
  LoadExternal.layer,
)

export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
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
      const nextRoute = Route.urlToApplicationRoute(url)
      return { model: modifyFields(model, { route: () => nextRoute }) }
    },

    GotCounterMessage: ({ message }) => counter.fold(model, message),
    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),
  }),
)
