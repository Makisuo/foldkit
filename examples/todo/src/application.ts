import { Layer } from 'effect'

import { GenerateTodo, SaveTodos } from './command'
import { Application } from './definition'

export const ApplicationComposition = Application.toComposition()

export const EffectsLayer = Layer.mergeAll(GenerateTodo.layer, SaveTodos.layer)
