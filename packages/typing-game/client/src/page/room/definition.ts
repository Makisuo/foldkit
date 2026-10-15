import { Block } from 'foldkit'
import type { HtmlBuilder } from 'foldkit/html'

import { Message } from './message'
import { Model } from './model'

export const Room = Block.define('Room', { Model, Message })

export type ViewBuilder = HtmlBuilder<Message>
