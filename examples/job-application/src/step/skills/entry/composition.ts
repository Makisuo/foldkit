import { type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  Message,
  type Model,
  ProficiencyRadioGroup,
  SkillsEntry,
} from './definition'

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

export const proficiencyRadioGroup = SkillsEntry.bindChild(
  ProficiencyRadioGroup,
  {
    field: 'proficiencyRadioGroup',
    parentMessage: Message.GotProficiencyRadioGroupMessage,
    outMessage: { fold: foldProficiencyRadioGroupOutMessage },
  },
)

export const SkillsEntryComposition = SkillsEntry.toComposition({
  children: [proficiencyRadioGroup],
})
