import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { Room } from './page'

const room = Room.block.connection({
  Model,
  field: 'room',
  parentMessage: Message.GotRoomMessage,
})

const roomInspection = Block.inspectConnection(room)

export const roomSubscriptions = roomInspection.subscriptions
export const roomManagedResources = roomInspection.managedResources
export const roomMounts = roomInspection.mounts
export const RoomEffectsLayer = roomInspection.EffectsLayer
