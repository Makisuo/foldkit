import { Panel } from './definition'
import { MeasurePanel } from './mount'

export const PanelComposition = Panel.toComposition({
  mounts: [MeasurePanel],
})
