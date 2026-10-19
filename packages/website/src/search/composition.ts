import { Tuple } from 'effect'
import type { Block } from 'foldkit'

import { DialogBlock } from '@foldkit/ui'

import { clearSearchQuery } from './clear'
import { SearchDefinition } from './definition'

const foldDialogOutMessage = SearchDefinition.makeOutMessageFold(DialogBlock, {
  Opened: () => SearchDefinition.stepNoop(),
  Closed: () => SearchDefinition.stepNoop(),
  CompletedClose: () => clearSearchQuery,
})

export const DialogBinding = SearchDefinition.bindChild(DialogBlock, {
  field: 'dialog',
  outMessage: { fold: foldDialogOutMessage },
  init: { contextToArgs: () => Tuple.make({ id: 'search-dialog' }) },
})

export const SearchComposition = SearchDefinition.makeComposition({
  bindings: [DialogBinding],
})
export type SearchViewBuilder = Block.ViewBuilderFor<typeof SearchComposition>
