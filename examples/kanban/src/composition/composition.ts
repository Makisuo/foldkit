import type { Block } from 'foldkit'

import { Application } from '../definition'
import { DragAndDropBinding } from './dragAndDrop'

export const ApplicationComposition = Application.toComposition({
  childBindings: [DragAndDropBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
