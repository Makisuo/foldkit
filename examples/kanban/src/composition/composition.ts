import type { Block } from 'foldkit'

import { ApplicationDefinition } from '../definition'
import { DragAndDropBinding } from './dragAndDrop'

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [DragAndDropBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
