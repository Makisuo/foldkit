import { Array, Option } from 'effect'
import { type Block, type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { EducationDefinition, Message, type Model } from './definition'
import * as Entry from './entry'

const foldEntryOutMessage = (
  entryId: string,
  outMessage: typeof Entry.OutMessage.Type,
) =>
  Entry.OutMessage.match<Update.Step<Model, Message>>(outMessage, {
    Removed: () => model => ({
      model: modifyFields(model, {
        entries: Array.filter(entry => entry.id !== entryId),
      }),
    }),
  })

export const EntriesBinding = EducationDefinition.bindChild(Entry.block, {
  field: 'entries',
  key: 'id',
  toParentMessage: (entryId, message) =>
    Message.GotEntryMessage({ entryId, message }),
  fromParentMessage: {
    parentMessage: Message.GotEntryMessage,
    args: (_model, { entryId, message }) => Option.some([entryId, message]),
  },
  init: {
    occurrences: ({ initialEntryId }) => [
      { key: initialEntryId, args: [initialEntryId] },
    ],
    toItem: (_occurrence, entry) => entry,
  },
  outMessage: { fold: foldEntryOutMessage },
})

export const EducationComposition = EducationDefinition.makeComposition({
  childBindings: [EntriesBinding],
})
export type EducationViewBuilder = Block.ViewBuilderFor<
  typeof EducationComposition
>
