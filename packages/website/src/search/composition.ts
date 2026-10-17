import { Tuple } from 'effect'
import type { Block } from 'foldkit'
import { Update } from 'foldkit'

import { Dialog } from '@foldkit/ui'

import { clearSearchQuery } from './clear'
import { SearchDefinition } from './definition'
import { Message } from './message'
import { Model } from './model'

const foldDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
  CompletedClose: () => clearSearchQuery,
})

export const DialogBinding = SearchDefinition.bindChild(Dialog.block, {
  field: 'dialog',
  parentMessage: Message.GotSearchDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
  init: { args: () => Tuple.make({ id: 'search-dialog' }) },
})

export const SearchComposition = SearchDefinition.makeComposition({
  childBindings: [DialogBinding],
})
export type SearchViewBuilder = Block.ViewBuilderFor<typeof SearchComposition>
