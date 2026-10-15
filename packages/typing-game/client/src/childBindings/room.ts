import { Option } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { Application } from '../definition'
import { Message } from '../message'
import { RoomInstance } from '../model'
import { Room } from '../page'
import { ApplicationRoute } from '../route'

export const room = Application.bindChild(Room.block, {
  placement: 'room',
  readAll: model => Option.toArray(model.maybeRoomInstance),
  key: roomInstance => roomInstance.roomId,
  read: roomInstance => roomInstance.model,
  writeAt: (model, roomId, nextRoom) =>
    modifyFields(model, {
      maybeRoomInstance: Option.map(roomInstance =>
        roomInstance.roomId === roomId
          ? RoomInstance.make({ roomId, model: nextRoom })
          : roomInstance,
      ),
    }),
  toParentMessage: (roomId, message) =>
    Message.GotRoomMessage({ roomId, message }),
  subscriptions: {
    when: (model, roomId) =>
      ApplicationRoute.matchOrElse(
        model.route,
        {
          Room: route => route.roomId === roomId,
        },
        () => false,
      ),
  },
})
