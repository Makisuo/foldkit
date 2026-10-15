import type { Block } from 'foldkit'

import { Application } from './definition'

export const ApplicationComposition = Application.toComposition()
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
