import { defineApplication } from 'foldkit'

import { Message } from './message'
import { Model } from './model'

export const ApplicationDefinition = defineApplication({ Model, Message })
