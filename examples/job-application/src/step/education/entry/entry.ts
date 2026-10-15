import { Option } from 'effect'
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
  EducationEntry,
  GraduationYearListbox,
  Message,
  type Model,
  OutMessage,
} from './definition'

export const schoolRules = makeRules({
  required: 'School is required',
})

export const degreeRules = makeRules({
  required: 'Degree is required',
})

export const fieldOfStudyRules = makeRules({
  required: 'Field of study is required',
})

const validateSchool = validate(schoolRules)
const validateDegree = validate(degreeRules)
const validateFieldOfStudy = validate(fieldOfStudyRules)

export const init = (entryId: string): Model => ({
  id: entryId,
  school: NotValidated({ value: '' }),
  degree: NotValidated({ value: '' }),
  fieldOfStudy: NotValidated({ value: '' }),
  maybeGraduationYear: Option.none(),
  graduationYearListbox: GraduationYearListbox.init({
    id: `${entryId}-graduation-year`,
  }).model,
  isCurrentlyEnrolled: false,
})

const foldGraduationYearListboxOutMessage =
  GraduationYearListbox.OutMessage.match<Update.Step<Model, Message>>({
    Selected:
      ({ value }) =>
      model => ({
        model: modifyFields(model, {
          maybeGraduationYear: () => Option.some(value),
        }),
      }),
  })

export const graduationYearListbox = EducationEntry.bindChild(
  GraduationYearListbox,
  {
    field: 'graduationYearListbox',
    parentMessage: Message.GotGraduationYearListboxMessage,
    outMessage: { fold: foldGraduationYearListboxOutMessage },
  },
)

export const EducationEntryComposition = EducationEntry.toComposition({
  children: [graduationYearListbox],
})

export const update = EducationEntry.update((model, message) =>
  Message.match(message, {
    UpdatedSchool: ({ value }) => ({
      model: modifyFields(model, { school: () => validateSchool(value) }),
    }),

    UpdatedDegree: ({ value }) => ({
      model: modifyFields(model, { degree: () => validateDegree(value) }),
    }),

    UpdatedFieldOfStudy: ({ value }) => ({
      model: modifyFields(model, {
        fieldOfStudy: () => validateFieldOfStudy(value),
      }),
    }),

    GotGraduationYearListboxMessage: ({ message }) =>
      graduationYearListbox.fold(model, message),

    ToggledCurrentlyEnrolled: ({ isChecked }) => ({
      model: modifyFields(model, { isCurrentlyEnrolled: () => isChecked }),
    }),

    ClickedRemoveSelf: () => ({ model, outMessage: OutMessage.Removed() }),
  }),
)

export const hasErrors = (entry: Model): boolean =>
  anyInvalid([entry.school, entry.degree, entry.fieldOfStudy])

export const isComplete = (entry: Model): boolean =>
  allValid([
    [entry.school, schoolRules],
    [entry.degree, degreeRules],
    [entry.fieldOfStudy, fieldOfStudyRules],
  ])

export const revealErrors = (entry: Model): Model =>
  modifyFields(entry, {
    school: revealFieldErrors(schoolRules),
    degree: revealFieldErrors(degreeRules),
    fieldOfStudy: revealFieldErrors(fieldOfStudyRules),
  })
