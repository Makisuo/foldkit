import { NotValidated } from 'foldkit/fieldValidation'

import { SkillsEntryComposition } from './composition'
import { update } from './update'
import { view } from './view'

export const block = SkillsEntryComposition.toBlock({
  init: SkillsEntryComposition.init((entryId: string) => ({
    startup: entryId,
    model: {
      id: entryId,
      name: NotValidated({ value: '' }),
      proficiency: 'Intermediate',
    },
  })),
  update,
  view,
})
