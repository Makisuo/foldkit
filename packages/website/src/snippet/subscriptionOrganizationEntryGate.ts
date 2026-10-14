import { ApplicationDefinition } from './application'
import { Message } from './message'
import { Model } from './model'
import * as Room from './room'

export const room = ApplicationDefinition.bindChild(Room.block, {
  field: 'room',
  parentMessage: Message.GotRoomMessage,
  subscriptions: {
    when: { roomKeyboard: ({ route }) => route._tag === 'Room' },
  },
})
