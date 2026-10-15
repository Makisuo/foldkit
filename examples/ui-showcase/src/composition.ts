import type { Block } from 'foldkit'

import { Application } from './definition'
import { Message } from './message'
import * as Ui from './ui'

export const ui = Application.bindChild(Ui.block, {
  field: 'uiModel',
  parentMessage: Message.GotUiMessage,
})

export const ApplicationComposition = Application.toComposition({
  children: [ui],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
