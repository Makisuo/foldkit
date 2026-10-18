import { ApplicationDefinition } from './definition'
import { Message } from './message'
import * as Room from './room'
import { ApplicationRoute } from './route'

const RoomBinding = ApplicationDefinition.bindChild(Room.block, {
  field: 'room',
  presentWhen: model =>
    ApplicationRoute.match(model.route, {
      Home: () => false,
      Room: () => true,
    }),
  parentMessage: Message.GotRoomMessage,
})
