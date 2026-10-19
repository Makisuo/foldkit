import { Array } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { SkillsDefinition } from './definition'
import { SkillsEntryBlock } from './entry'

const foldEntryOutMessage = (entryId: string) =>
  SkillsDefinition.makeOutMessageFold(SkillsEntryBlock, {
    Removed: () => model => ({
      model: modifyFields(model, {
        entries: Array.filter(entry => entry.id !== entryId),
      }),
    }),
  })

export const EntriesBinding = SkillsDefinition.bindChild(SkillsEntryBlock, {
  field: 'entries',
  key: 'id',
  init: {
    instances: initialEntryId => [
      { key: initialEntryId, args: [initialEntryId] },
    ],
    toItem: (_occurrence, entry) => entry,
  },
  outMessage: {
    fold: (entryId, outMessage) => foldEntryOutMessage(entryId)(outMessage),
  },
})

export const SkillsComposition = SkillsDefinition.makeComposition({
  bindings: [EntriesBinding],
})
