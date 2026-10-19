import { Array } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { WorkHistoryDefinition } from './definition'
import { WorkHistoryEntryBlock } from './entry'

const foldEntryOutMessage = (entryId: string) =>
  WorkHistoryDefinition.makeOutMessageFold(WorkHistoryEntryBlock, {
    Removed: () => model => ({
      model: modifyFields(model, {
        entries: Array.filter(entry => entry.id !== entryId),
      }),
    }),
  })

export const EntriesBinding = WorkHistoryDefinition.bindChild(
  WorkHistoryEntryBlock,
  {
    field: 'entries',
    key: 'id',
    init: {
      instances: ({ today, initialEntryId }) => [
        { key: initialEntryId, args: [initialEntryId, today] },
      ],
      toItem: (_occurrence, entry) => entry,
    },
    outMessage: {
      fold: (entryId, outMessage) => foldEntryOutMessage(entryId)(outMessage),
    },
  },
)

export const WorkHistoryComposition = WorkHistoryDefinition.makeComposition({
  bindings: [EntriesBinding],
})
