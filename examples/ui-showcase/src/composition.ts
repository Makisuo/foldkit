import type { Block } from 'foldkit'

import { ApplicationDefinition } from './definition'
import { Message } from './message'
import * as Ui from './ui'

export const UiBinding = ApplicationDefinition.bindChild(Ui.block, {
  field: 'uiModel',
  parentMessage: Message.GotUiMessage,
  init: { args: ({ today }) => [today] },
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [UiBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
