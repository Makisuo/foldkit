import { ApplicationDefinition } from './definition'
import * as Home from './home'
import * as Room from './room'

const foldHomeOutMessage = ApplicationDefinition.makeOutMessageFold(
  Home.HomeBlock,
  {
    SelectedRoom: ({ roomId }) => RoomBinding.requestOpen(roomId),
  },
)

export const HomeBinding = ApplicationDefinition.bindChild(Home.HomeBlock, {
  field: 'home',
  outMessage: { fold: foldHomeOutMessage },
})

const foldRoomOutMessage = ApplicationDefinition.makeOutMessageFold(
  Room.RoomBlock,
  {
    SavedRoom: ({ roomId }) => HomeBinding.informRoomSaved(roomId),
  },
)

export const RoomBinding = ApplicationDefinition.bindChild(Room.RoomBlock, {
  field: 'room',
  outMessage: { fold: foldRoomOutMessage },
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  bindings: [HomeBinding, RoomBinding],
})
