import { Schema } from 'effect'
import { Block, Update } from 'foldkit'
import {
  Field,
  NotValidated,
  allValid,
  anyInvalid,
  makeRules,
  validate,
} from 'foldkit/fieldValidation'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { RadioGroup } from '@foldkit/ui'

import { ProficiencyLevel } from '../../../domain'
import { revealFieldErrors } from '../../validation'

// FIELD VALIDATION

export const nameRules = makeRules({
  required: 'Skill name is required',
})

const validateName = validate(nameRules)

export const proficiencyRadioGroupId = (entryId: string): string =>
  `${entryId}-proficiency`

export const ProficiencyRadioGroup =
  RadioGroup.create<ProficiencyLevel.ProficiencyLevel>()

export const Model = Schema.Struct({
  id: Schema.String,
  name: Field(Schema.String),
  proficiency: ProficiencyLevel.ProficiencyLevel,
  proficiencyRadioGroup: ProficiencyRadioGroup.Model,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  UpdatedName: { value: Schema.String },
  GotProficiencyRadioGroupMessage: { message: ProficiencyRadioGroup.Message },
  ClickedRemoveSelf: {},
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Removed: {},
})

export type OutMessage = typeof OutMessage.Type

export type Removed = typeof OutMessage.Removed.Type

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

const SkillsEntryDefinition = Block.define('SkillsEntry', {
  Model,
  Message,
  OutMessage,
})

export const proficiencyRadioGroup = SkillsEntryDefinition.bindChild(
  ProficiencyRadioGroup,
  {
    field: 'proficiencyRadioGroup',
    parentMessage: Message.GotProficiencyRadioGroupMessage,
    outMessage: { fold: foldProficiencyRadioGroupOutMessage },
  },
)

export const SkillsEntryComposition = SkillsEntryDefinition.toComposition({
  children: [proficiencyRadioGroup],
})

export const update = SkillsEntryDefinition.update((model, message) =>
  Message.match(message, {
    UpdatedName: ({ value }) => ({
      model: modifyFields(model, { name: () => validateName(value) }),
    }),

    GotProficiencyRadioGroupMessage: ({ message }) =>
      proficiencyRadioGroup.fold(model, message),

    ClickedRemoveSelf: () => ({ model, outMessage: OutMessage.Removed() }),
  }),
)

// VALIDATION SUMMARY

export const hasErrors = (entry: Model): boolean => anyInvalid([entry.name])

export const isComplete = (entry: Model): boolean =>
  allValid([[entry.name, nameRules]])

export const revealErrors = (entry: Model): Model =>
  modifyFields(entry, { name: revealFieldErrors(nameRules) })
