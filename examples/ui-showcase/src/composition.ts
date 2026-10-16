import type { Block } from 'foldkit'

import { Application } from './definition'
import type { Flags } from './flags'
import { Message } from './message'
import * as Ui from './ui'

export const UiBinding = Application.bindChild(Ui.block, {
  field: 'uiModel',
  parentMessage: Message.GotUiMessage,
  init: { args: ({ today }: Flags) => [today] },
})

export const ApplicationComposition = Application.toComposition({
  childBindings: [UiBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
