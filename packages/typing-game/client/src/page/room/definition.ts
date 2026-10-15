import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'

export const Room = Block.define('Room', { Model, Message })

export const RoomComposition = Room.toComposition()
export type RoomViewBuilder = Block.HtmlBuilderOf<typeof RoomComposition>
