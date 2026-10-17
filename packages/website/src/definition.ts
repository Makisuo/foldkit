import { defineApplication } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { Startup } from './startup'

export const ApplicationDefinition = defineApplication({
  Model,
  Message,
  Startup,
})
