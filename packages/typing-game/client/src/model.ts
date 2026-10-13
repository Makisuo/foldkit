import { Schema } from 'effect'

import { Home, Room } from './page'
import { ApplicationRoute } from './route'

export const Model = Schema.Struct({
  route: ApplicationRoute,
  home: Home.Model,
  room: Room.Model,
})
export type Model = typeof Model.Type
