import type { Block } from 'foldkit'

import type { ui } from './update'

export type ViewBuilder = Block.HtmlBuilderOf<typeof ui>
