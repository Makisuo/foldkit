import { Effect, Option, Schema } from 'effect'
import { Update } from 'foldkit'
import { pushUrl } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'

import * as Shared from '@typing-game/shared'

import { Application } from '../definition'
import { Message } from '../message'
import { RoomInstance } from '../model'
import { Home } from '../page'
import { roomRouter } from '../route'
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
}: Readonly<{ informJoined: typeof Room.RoomBinding.informJoined }>) => {
  const navigateToRoom = (roomId: string) =>
    Application.step(model => ({
      model,
      commands: [NavigateToRoom({ roomId })],
    }))

  const enterJoinedRoom = (roomId: string, player: Shared.Player) => {
    return Update.combine([
      Application.step(model =>
        Room.RoomBinding.init({
          key: roomId,
          args: [Option.none()],
          toParentModel: room =>
            modifyFields(model, {
              maybeRoomInstance: () =>
                Option.some(RoomInstance.make({ roomId, model: room })),
            }),
        }),
      ),
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
    presentWhen: model => model.route._tag === 'Home',
    parentMessage: Message.GotHomeMessage,
    outMessage: { fold: foldHomeOutMessage },
    init: true,
  })
}
