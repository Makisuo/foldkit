import { ApplicationDefinition } from './definition'
import * as Home from './home'
import { Message } from './message'
import * as Room from './room'

const foldHomeOutMessage = Home.OutMessage.match({
  SelectedRoom: ({ roomId }) => RoomBinding.requestOpen(roomId),
})

export const HomeBinding = ApplicationDefinition.bindChild(Home.block, {
  field: 'home',
  parentMessage: Message.GotHomeMessage,
  outMessage: { fold: foldHomeOutMessage },
})

const foldRoomOutMessage = Room.OutMessage.match({
  SavedRoom: ({ roomId }) => HomeBinding.informRoomSaved(roomId),
})

export const RoomBinding = ApplicationDefinition.bindChild(Room.block, {
  field: 'room',
  parentMessage: Message.GotRoomMessage,
  outMessage: { fold: foldRoomOutMessage },
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [HomeBinding, RoomBinding],
})
