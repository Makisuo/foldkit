import { Layer } from 'effect'
import type { Block } from 'foldkit'

import { GenerateTodo, SaveTodos } from './command'
import { Application } from './definition'

export const ApplicationComposition = Application.toComposition()

export type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>

export const EffectsLayer = Layer.mergeAll(GenerateTodo.layer, SaveTodos.layer)
