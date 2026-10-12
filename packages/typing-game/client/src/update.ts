import { Effect, Match, Schema } from 'effect'
import { Command, Url } from 'foldkit'
import { UrlRequest, load, pushUrl } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'

import { contract } from './definition'
import { Message } from './message'
import { owner } from './owner'
import { urlToAppRoute } from './route'
import { home, room } from './submodels'

export const NavigateInternal = Command.define(owner.name('NavigateInternal'), {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigateInternal],
  handler: function* () {
    return ({ url }) =>
      pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal()))
  },
})

export const LoadExternal = Command.define(owner.name('LoadExternal'), {
  args: { href: Schema.String },
  messages: [Message.CompletedLoadExternal],
  handler: function* () {
    return ({ href }) =>
      load(href).pipe(Effect.as(Message.CompletedLoadExternal()))
  },
})

export const update = contract.defineUpdate((model, message) =>
  Message.match(message, {
    ClickedLink: ({ request }) =>
      UrlRequest.match(request, {
        Internal: ({ url }) => ({
          model,
          commands: [NavigateInternal({ url: Url.toString(url) })],
        }),
        External: ({ href }) => ({
          model,
          commands: [LoadExternal({ href })],
        }),
      }),

    ChangedUrl: ({ url }) => ({
      model: modifyFields(model, {
        route: () => urlToAppRoute(url),
      }),
    }),

    GotHomeMessage: ({ message }) => home.fold(model, message),

    GotRoomMessage: ({ message }) =>
      Match.value(model.route).pipe(
        Match.tag('Room', ({ roomId }) =>
          room.fold(model, message, { roomId }),
        ),
        Match.orElse(() => ({ model })),
      ),
    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),
    CompletedNavigateToRoom: () => ({ model }),
  }),
)
