import type { HtmlBuilderOf } from 'foldkit/application'

import type { ApplicationComposition } from '../application'

export type StateMachineHtmlBuilder = HtmlBuilderOf<
  typeof ApplicationComposition
>
