import { ApplicationDefinition } from './application'
import { Message } from './message'
import { Model } from './model'
import * as Room from './room'

const room = ApplicationDefinition.bindChild(Room.block, {
  field: 'room',
  parentMessage: Message.GotRoomMessage,
  subscriptions: {
    when: { roomKeyPresses: model => model.route._tag === 'Room' },
  },
})
