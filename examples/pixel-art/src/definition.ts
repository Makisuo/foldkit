import { define as defineApplication } from 'foldkit/application'

import { Message } from './message'
import { Model } from './model'

export const ApplicationDefinition = defineApplication({ Model, Message })
