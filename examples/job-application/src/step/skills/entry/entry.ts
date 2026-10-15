import { type Update } from 'foldkit'
import {
  NotValidated,
  allValid,
  anyInvalid,
  makeRules,
  validate,
} from 'foldkit/fieldValidation'
import { modifyFields } from 'foldkit/struct'

import { revealFieldErrors } from '../../validation'
import {
  Message,
  type Model,
  OutMessage,
  ProficiencyRadioGroup,
  SkillsEntry,
} from './definition'

export const nameRules = makeRules({
  required: 'Skill name is required',
})

const validateName = validate(nameRules)

export const proficiencyRadioGroupId = (entryId: string): string =>
  `${entryId}-proficiency`

export const init = (entryId: string): Model => ({
  id: entryId,
  name: NotValidated({ value: '' }),
  proficiency: 'Intermediate',
  proficiencyRadioGroup: ProficiencyRadioGroup.init({
    id: proficiencyRadioGroupId(entryId),
  }).model,
})

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

export const update = SkillsEntry.update((model, message) =>
  Message.match(message, {
    UpdatedName: ({ value }) => ({
      model: modifyFields(model, { name: () => validateName(value) }),
    }),

    GotProficiencyRadioGroupMessage: ({ message }) =>
      proficiencyRadioGroup.fold(model, message),

    ClickedRemoveSelf: () => ({ model, outMessage: OutMessage.Removed() }),
  }),
)

export const hasErrors = (entry: Model): boolean => anyInvalid([entry.name])

export const isComplete = (entry: Model): boolean =>
  allValid([[entry.name, nameRules]])

export const revealErrors = (entry: Model): Model =>
  modifyFields(entry, { name: revealFieldErrors(nameRules) })
