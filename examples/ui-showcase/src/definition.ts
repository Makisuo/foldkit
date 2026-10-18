import { defineApplication } from 'foldkit'

import { Flags } from './flags'
import { Message } from './message'
import { Model } from './model'

export const ApplicationDefinition = defineApplication({
  Model,
  Message,
  Startup: Flags,
})
