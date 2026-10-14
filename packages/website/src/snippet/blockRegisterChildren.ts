import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { primaryComposer, secondaryComposer } from './placements'

export const Chat = Block.define('Chat', { Model, Message })

export const ChatComposition = Chat.toComposition({
  children: [primaryComposer, secondaryComposer],
})
