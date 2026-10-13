import { Update } from 'foldkit'

import * as Shared from '@typing-game/shared'

import { NavigateToRoom } from './command'
import * as Authoring from './definition'
import { Message } from './message'
import { Model } from './model'
import { Home, Room } from './page'

export const room = Room.block.connection({
  Model,
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

const foldHomeOutMessage = Home.OutMessage.match<
  ReturnType<typeof enterJoinedRoom>
>({
  CreatedRoom: ({ roomId, player }) => enterJoinedRoom(roomId, player),
  JoinedRoom: ({ roomId, player }) => enterJoinedRoom(roomId, player),
})

export const home = Home.block.connection({
  Model,
  field: 'home',
  parentMessage: Message.GotHomeMessage,
  subscriptions: {
    when: ({ route }) => route._tag === 'Home',
  },
  outMessage: {
    fold: foldHomeOutMessage,
  },
})

export const Application = Authoring.Application.register({
  children: [home, room],
})
