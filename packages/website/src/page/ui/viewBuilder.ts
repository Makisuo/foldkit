import type { Block } from 'foldkit'

import type { RegisteredUiDefinition } from './update'

export type ViewBuilder = Block.HtmlBuilderOf<typeof RegisteredUiDefinition>
