import { Effect, Layer, Match, Schema } from 'effect'
import { Update, Url } from 'foldkit'
import { define as defineApplication } from 'foldkit/application'
import { UrlRequest, load, pushUrl } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'

import * as Shared from '@typing-game/shared'

import { Message } from './message'
import { Model } from './model'
import { Home, Room } from './page'
import { ApplicationRoute, roomRouter, urlToApplicationRoute } from './route'

const ApplicationDefinition = defineApplication({ Model, Message })

const NavigateToRoom = ApplicationDefinition.command('NavigateToRoom', {
  args: { roomId: Schema.String },
  messages: [Message.CompletedNavigateToRoom],
  handler: function* () {
    return ({ roomId }) =>
      pushUrl(roomRouter({ roomId })).pipe(
        Effect.as(Message.CompletedNavigateToRoom()),
      )
  },
})

const NavigateInternal = ApplicationDefinition.command('NavigateInternal', {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigateInternal],
  handler: function* () {
    return ({ url }) =>
      pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal()))
  },
})

const LoadExternal = ApplicationDefinition.command('LoadExternal', {
  args: { href: Schema.String },
  messages: [Message.CompletedLoadExternal],
  handler: function* () {
    return ({ href }) =>
      load(href).pipe(Effect.as(Message.CompletedLoadExternal()))
  },
})

export const room = ApplicationDefinition.bindChild(Room.block, {
  field: 'room',
  parentMessage: Message.GotRoomMessage,
  subscriptions: {
    when: { roomKeyPresses: ({ route }) => route._tag === 'Room' },
  },
})

const navigateToRoom = (roomId: string) => (model: Model) => ({
  model,
  commands: [NavigateToRoom({ roomId })],
})

const enterJoinedRoom = (roomId: string, player: Shared.Player) =>
  Update.combine([
    navigateToRoom(roomId),
    room.informJoined(player, { roomId }),
  ])

const foldHomeOutMessage = Home.OutMessage.match({
  CreatedRoom: ({ roomId, player }) => enterJoinedRoom(roomId, player),
  JoinedRoom: ({ roomId, player }) => enterJoinedRoom(roomId, player),
})

export const home = ApplicationDefinition.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
  subscriptions: {
    when: ({ route }) => route._tag === 'Home',
  },
  outMessage: { fold: foldHomeOutMessage },
})

export const ApplicationComposition = ApplicationDefinition.toComposition({
  children: [home, room],
})

export const init = (url: Url.Url) => {
  const route = urlToApplicationRoute(url)
  const homeInit = home.init()
  const roomInit = room.init(route)
  const commands = ApplicationRoute.match(route, {
    Home: () => homeInit.commands ?? [],
    Room: () => roomInit.commands ?? [],
    NotFound: () => [],
  })
  const model = Model.make({
    route,
    home: homeInit.model,
    room: roomInit.model,
  })

  return { model, commands }
}

export const update = ApplicationComposition.update((model, message) =>
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
        route: () => urlToApplicationRoute(url),
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

export const EffectsLayer = Layer.mergeAll(
  NavigateToRoom.layer,
  NavigateInternal.layer,
  LoadExternal.layer,
)
