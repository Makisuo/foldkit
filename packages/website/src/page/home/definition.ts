import { Menu } from '@foldkit/ui'

import { asyncCounterDemo, notePlayerDemo } from './bindings'
import { Message, OutMessage } from './message'
import { Model } from './model'
import { owner } from './owner'

export const contract = owner.define({
  Model,
  Message,
  OutMessage,
  mounts: Menu.mounts,
  children: [asyncCounterDemo, notePlayerDemo],
})
