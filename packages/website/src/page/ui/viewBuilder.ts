import type { Block } from 'foldkit'

import type { UiComposition } from './update'

export type ViewBuilder = Block.HtmlBuilderOf<typeof UiComposition>
