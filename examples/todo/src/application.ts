import { Layer } from 'effect'

import { GenerateTodo, SaveTodos } from './command'
import { ApplicationDefinition } from './definition'

export const ApplicationComposition = ApplicationDefinition.toComposition()

export const EffectsLayer = Layer.mergeAll(GenerateTodo.layer, SaveTodos.layer)
