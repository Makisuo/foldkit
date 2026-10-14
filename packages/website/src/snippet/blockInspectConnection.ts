import { Block } from 'foldkit'

import { ApplicationDefinition } from './application'
import { Message } from './message'
import { Model } from './model'
import { Room } from './page'

const room = ApplicationDefinition.bindChild(Room.block, {
  field: 'room',
  parentMessage: Message.GotRoomMessage,
})

const roomInspection = Block.inspectBinding(room)

export const roomSubscriptions = roomInspection.subscriptions
export const roomManagedResources = roomInspection.managedResources
export const roomMounts = roomInspection.mounts
export const RoomEffectsLayer = roomInspection.EffectsLayer
