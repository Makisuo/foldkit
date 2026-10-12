import { Message } from './message'
import { Model } from './model'
import { mounts } from './mounts'
import { owner } from './owner'
import { home } from './submodels'

export const contract = owner.define({
  Model,
  Message,
  mounts,
  children: [home],
})
