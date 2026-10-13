import { Option } from 'effect'

import { Message } from './message'
import type { Model } from './model'
import * as SignedIn from './signedIn'

const readSignedIn = (model: Model) =>
  Option.liftPredicate(model, model => model._tag === 'SignedIn')

export const signedIn = SignedIn.block.connection({
  read: readSignedIn,
  write: (model, nextSignedIn) => nextSignedIn,
  parentMessage: Message.GotSignedInMessage,
})
