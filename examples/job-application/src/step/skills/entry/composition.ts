import { type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  Message,
  type Model,
  ProficiencyRadioGroup,
  SkillsEntryDefinition,
} from './definition'
import { proficiencyRadioGroupId } from './init'

const foldProficiencyRadioGroupOutMessage =
  ProficiencyRadioGroup.OutMessage.match<
    Update.Step<Model, Message>,
    typeof ProficiencyRadioGroup.OutMessage.Type
  >({
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
    parentMessage: Message.GotProficiencyRadioGroupMessage,
    init: {
      startupToArgs: entryId => [{ id: proficiencyRadioGroupId(entryId) }],
    },
    outMessage: { fold: foldProficiencyRadioGroupOutMessage },
  },
)

export const SkillsEntryComposition = SkillsEntryDefinition.makeComposition({
  childBindings: [ProficiencyRadioGroupBinding],
})
