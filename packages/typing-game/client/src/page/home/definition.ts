import { Message, OutMessage } from './message'
import { Model } from './model'
import { owner } from './owner'

export const contract = owner.define({ Model, Message, OutMessage })
