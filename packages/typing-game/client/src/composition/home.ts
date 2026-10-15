import { Effect, Option, Schema } from 'effect'
import { Update } from 'foldkit'
import { pushUrl } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'

import * as Shared from '@typing-game/shared'

import { Application } from '../definition'
import { Message } from '../message'
import { Model, RoomInstance } from '../model'
import { Home } from '../page'
import { ApplicationRoute, roomRouter } from '../route'
import * as Room from './room'

export const NavigateToRoom = Application.command('NavigateToRoom', {
  args: { roomId: Schema.String },
  messages: [Message.CompletedNavigateToRoom],
  handler: function* () {
    return ({ roomId }) =>
      pushUrl(roomRouter({ roomId })).pipe(
        Effect.as(Message.CompletedNavigateToRoom()),
      )
  },
})

export const bind = ({
  informJoined,
}: Readonly<{ informJoined: typeof Room.room.informJoined }>) => {
  const navigateToRoom = (roomId: string) => (model: Model) => ({
    model,
    commands: [NavigateToRoom({ roomId })],
  })

  const enterJoinedRoom = (roomId: string, player: Shared.Player) => {
    const roomInit = Room.room.init(roomId, Option.none())

    return Update.combine([
      model => ({
        model: modifyFields(model, {
          maybeRoomInstance: () =>
            Option.some(RoomInstance.make({ roomId, model: roomInit.model })),
        }),
        commands: roomInit.commands,
      }),
      informJoined(roomId, player, { roomId }),
      navigateToRoom(roomId),
    ])
  }

  const foldHomeOutMessage = Home.OutMessage.match({
    CreatedRoom: ({ roomId, player }) => enterJoinedRoom(roomId, player),
    JoinedRoom: ({ roomId, player }) => enterJoinedRoom(roomId, player),
  })

  return Application.bindChild(Home.block, {
    field: 'home',
    presentWhen: model =>
      ApplicationRoute.match(model.route, {
        Home: () => true,
        Room: () => false,
        NotFound: () => false,
      }),
    parentMessage: Message.GotHomeMessage,
    outMessage: { fold: foldHomeOutMessage },
  })
}
