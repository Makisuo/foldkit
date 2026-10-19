import { Option } from 'effect'
import { Update } from 'foldkit'

import { ApplicationDefinition, Message, Model } from './application/definition'
import { DetailsBlock } from './details'
import { SearchBlock } from './search'

const foldSearchOutMessage = (
  outMessage: typeof SearchBlock.OutMessage.Type,
  context: Update.FoldContext<typeof SearchBlock.Message.Type, Message, Model>,
) =>
  SearchBlock.OutMessage.match(outMessage, {
    SelectedResult: ({ resultId }) =>
      Option.isSome(context.modelBeforeUpdate.maybeDetails)
        ? DetailsBinding.informResultChanged({ resultId })
        : DetailsBinding.requestOpen({ resultId }),
  })

export const SearchBinding = ApplicationDefinition.bindChild(SearchBlock, {
  field: 'search',
  outMessage: { fold: foldSearchOutMessage },
})

export const DetailsBinding = ApplicationDefinition.bindChild(DetailsBlock, {
  field: 'maybeDetails',
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  bindings: [SearchBinding, DetailsBinding],
})
