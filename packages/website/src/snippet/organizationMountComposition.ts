import type { Block } from 'foldkit'

import { Panel } from './definition'
import { MeasurePanel } from './mount'

export const PanelComposition = Panel.toComposition({
  mounts: [MeasurePanel],
})

export type ViewBuilder = Block.HtmlBuilderOf<typeof PanelComposition>
