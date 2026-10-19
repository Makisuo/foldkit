import { ApplicationDefinition } from '../definition'
import { RoomBlock } from '../page'
import { ApplicationRoute } from '../route'

export const RoomBinding = ApplicationDefinition.bindChild(RoomBlock, {
  field: 'maybeRoomInstance',
  key: 'roomId',
  childField: 'model',
  delivery: {
    when: (model, roomId) =>
      ApplicationRoute.matchOrElse(
        model.route,
        {
          Room: route => route.roomId === roomId,
        },
        () => false,
      ),
    toUpdateContext: (_model, roomId) => [{ roomId }],
  },
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
