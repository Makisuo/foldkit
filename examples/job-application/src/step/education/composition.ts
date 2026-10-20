import { Array } from 'effect'
import type { Block } from 'foldkit'

import { EducationDefinition } from './definition'
import { EducationEntryBlock } from './entry'

const foldEntryOutMessage = (entryId: string) =>
  EducationDefinition.makeOutMessageFold(EducationEntryBlock, {
    Removed: () =>
      EducationDefinition.stepFields(() => ({
        entries: Array.filter(entry => entry.id !== entryId),
      })),
  })

export const EntriesBinding = EducationDefinition.bindChild(
  EducationEntryBlock,
  {
    field: 'entries',
    key: 'id',
    init: {
      instances: ({ initialEntryId }) => [
        { key: initialEntryId, args: [initialEntryId] },
      ],
      toItem: (_occurrence, entry) => entry,
    },
  },
).withOutMessagePolicy({
  fold: (entryId, outMessage) => foldEntryOutMessage(entryId)(outMessage),
})

export const EducationComposition = EducationDefinition.makeComposition({
  bindings: [EntriesBinding],
})
export type EducationViewBuilder = Block.ViewBuilderFor<
  typeof EducationComposition
>
