import { Message } from './message'
import { Model } from './model'
import * as Room from './room'

const room = Room.block.connection({
  Model,
  field: 'room',
  parentMessage: Message.GotRoomMessage,
  subscriptions: {
    when: { roomKeyPresses: model => model.route._tag === 'Room' },
  },
})
