import { Message } from './message'
import { Model } from './model'
import * as Room from './room'

export const room = Room.block.connection({
  Model: Model,
  field: 'room',
  parentMessage: Message.GotRoomMessage,
  subscriptions: {
    when: { roomKeyboard: ({ route }) => route._tag === 'Room' },
  },
})
