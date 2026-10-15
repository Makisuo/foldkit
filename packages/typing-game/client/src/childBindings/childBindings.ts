import { bindHome } from './home'
import { room } from './room'

export { room }

export const home = bindHome({ informJoined: room.informJoined })

export const children = [home, room] as const
