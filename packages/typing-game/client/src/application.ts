import { Effect, Layer, Option, Schema } from 'effect'
import { Url } from 'foldkit'
import type { Block } from 'foldkit'
import { UrlRequest, load, pushUrl } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'

import { children, home, room } from './childBindings'
import { NavigateToRoom } from './childBindings/home'
import { Application } from './definition'
import { Message } from './message'
import { Model, RoomInstance } from './model'
import { ApplicationRoute, urlToApplicationRoute } from './route'

const NavigateInternal = Application.command('NavigateInternal', {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigateInternal],
  handler: function* () {
    return ({ url }) =>
      pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal()))
  },
})

const LoadExternal = Application.command('LoadExternal', {
  args: { href: Schema.String },
  messages: [Message.CompletedLoadExternal],
  handler: function* () {
    return ({ href }) =>
      load(href).pipe(Effect.as(Message.CompletedLoadExternal()))
  },
})

export const ApplicationComposition = Application.toComposition({
  children,
})

export type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>

export const init = (url: Url.Url) => {
  const route = urlToApplicationRoute(url)
  const homeInit = home.init()

  return ApplicationRoute.match(route, {
    Home: () => ({
      model: Model.make({
        route,
        home: homeInit.model,
        maybeRoomInstance: Option.none(),
      }),
      commands: homeInit.commands,
    }),
    Room: ({ roomId }) => {
      const roomInit = room.init(roomId, Option.some(roomId))

      return {
        model: Model.make({
          route,
          home: homeInit.model,
          maybeRoomInstance: Option.some(
            RoomInstance.make({ roomId, model: roomInit.model }),
          ),
        }),
        commands: roomInit.commands,
      }
    },
    NotFound: () => ({
      model: Model.make({
        route,
        home: homeInit.model,
        maybeRoomInstance: Option.none(),
      }),
    }),
  })
}

const changeRoute = (model: Model, url: Url.Url) => {
  const route = urlToApplicationRoute(url)
  const routeChanged = modifyFields(model, { route: () => route })

  return ApplicationRoute.match(route, {
    Home: () => ({
      model: modifyFields(routeChanged, {
        maybeRoomInstance: () => Option.none(),
      }),
    }),
    Room: ({ roomId }) =>
      Option.match(model.maybeRoomInstance, {
        onNone: () => initializeRoom(routeChanged, roomId),
        onSome: roomInstance =>
          roomInstance.roomId === roomId
            ? { model: routeChanged }
            : initializeRoom(routeChanged, roomId),
      }),
    NotFound: () => ({
      model: modifyFields(routeChanged, {
        maybeRoomInstance: () => Option.none(),
      }),
    }),
  })
}

const initializeRoom = (model: Model, roomId: string) => {
  const roomInit = room.init(roomId, Option.some(roomId))

  return {
    model: modifyFields(model, {
      maybeRoomInstance: () =>
        Option.some(RoomInstance.make({ roomId, model: roomInit.model })),
    }),
    commands: roomInit.commands,
  }
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
    ChangedUrl: ({ url }) => changeRoute(model, url),
    GotHomeMessage: ({ message }) =>
      ApplicationRoute.match(model.route, {
        Home: () => home.fold(model, message),
        Room: () => ({ model }),
        NotFound: () => ({ model }),
      }),
    GotRoomMessage: ({ roomId, message }) =>
      ApplicationRoute.match(model.route, {
        Home: () => ({ model }),
        Room: route =>
          route.roomId === roomId
            ? room.fold(model, roomId, message, { roomId })
            : { model },
        NotFound: () => ({ model }),
      }),
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
