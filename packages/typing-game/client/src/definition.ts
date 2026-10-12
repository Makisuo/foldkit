import { Message } from './message'
import { Model } from './model'
import { owner } from './owner'
import { home, room } from './submodels'

export const contract = owner.define({
  Model,
  Message,
  children: [home, room],
})
