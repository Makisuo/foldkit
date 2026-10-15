import type { Block } from 'foldkit'

import { Nested } from '../definition.js'

export const NestedComposition = Nested.toComposition()
export type NestedViewBuilder = Block.HtmlBuilderOf<typeof NestedComposition>
