import { modifyFields } from 'foldkit/struct'

import { ProficiencyRadioGroup, SkillsEntryDefinition } from './definition'

const proficiencyRadioGroupId = (entryId: string): string =>
  `${entryId}-proficiency`

const foldProficiencyRadioGroupOutMessage =
  SkillsEntryDefinition.makeOutMessageFold(ProficiencyRadioGroup, {
    Selected:
      ({ value }) =>
      model => ({
        model: modifyFields(model, { proficiency: () => value }),
      }),
  })

export const ProficiencyRadioGroupBinding = SkillsEntryDefinition.bindChild(
  ProficiencyRadioGroup,
  {
    field: 'proficiencyRadioGroup',
    init: {
      contextToArgs: entryId => [{ id: proficiencyRadioGroupId(entryId) }],
    },
    outMessage: { fold: foldProficiencyRadioGroupOutMessage },
  },
)

export const SkillsEntryComposition = SkillsEntryDefinition.makeComposition({
  bindings: [ProficiencyRadioGroupBinding],
})
