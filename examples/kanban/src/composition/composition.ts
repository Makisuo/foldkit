import type { Block } from 'foldkit'

import { Application } from '../definition'
import * as DragAndDrop from './dragAndDrop'

export const ApplicationComposition = Application.toComposition({
  children: [DragAndDrop.dragAndDrop],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
