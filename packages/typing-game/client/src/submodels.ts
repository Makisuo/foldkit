import { Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import * as Shared from '@typing-game/shared'

import { NavigateToRoom } from './command'
import { Message } from './message'
import { Model } from './model'
import { Home, Room } from './page'

export const room = Room.bind({
  placement: 'room',
  read: (model: Model) => Option.some(model.room),
  write: (model, nextRoom) => modifyFields(model, { room: () => nextRoom }),
  toParentMessage: message => Message.GotRoomMessage({ message }),
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
    room.steps.informJoined(player, { roomId }),
  ])

export const home = Home.bind({
  placement: 'home',
  read: (model: Model) => Option.some(model.home),
  write: (model, nextHome) => modifyFields(model, { home: () => nextHome }),
  toParentMessage: message => Message.GotHomeMessage({ message }),
  subscriptions: {
    when: ({ route }) => route._tag === 'Home',
  },
  outMessage: {
    fold: Home.OutMessage.match({
      CreatedRoom: ({ roomId, player }) => enterJoinedRoom(roomId, player),
      JoinedRoom: ({ roomId, player }) => enterJoinedRoom(roomId, player),
    }),
  },
})
