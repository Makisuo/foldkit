import { Schema } from 'effect'

import { HomeBlock, RoomBlock } from './page'
import { ApplicationRoute } from './route'

export const RoomInstance = Schema.Struct({
  roomId: Schema.String,
  model: RoomBlock.Model,
})

export const Model = Schema.Struct({
  route: ApplicationRoute,
  home: HomeBlock.Model,
  maybeRoomInstance: Schema.Option(RoomInstance),
})
