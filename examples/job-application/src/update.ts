import { Array, Option, pipe } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { SubmitApplication } from './command'
import {
  Application,
  attachments,
  coverLetter,
  education,
  personalInfo,
  skills,
  stepMenu,
  stepTabs,
  workHistory,
} from './connection'
import { Step } from './domain'
import { Message } from './message'
import { type Model, Submission } from './model'
import {
  isComplete as isEducationComplete,
  revealErrors as revealEducationErrors,
} from './step/education'
import {
  isComplete as isPersonalInfoComplete,
  revealErrors as revealPersonalInfoErrors,
} from './step/personalInfo'
import {
  isComplete as isSkillsComplete,
  revealErrors as revealSkillsErrors,
} from './step/skills'
import {
  isComplete as isWorkHistoryComplete,
  revealErrors as revealWorkHistoryErrors,
} from './step/workHistory'

const isApplicationComplete = (model: Model): boolean =>
  isPersonalInfoComplete(model.personalInfo) &&
  isWorkHistoryComplete(model.workHistory) &&
  isEducationComplete(model.education) &&
  isSkillsComplete(model.skills)

const toNextStep = (current: Step.Step): Step.Step =>
  pipe(
    Step.all,
    Array.get(Step.indexOf(current) + 1),
    Option.getOrElse(() => current),
  )

const toPreviousStep = (current: Step.Step): Step.Step =>
  pipe(
    Step.all,
    Array.get(Step.indexOf(current) - 1),
    Option.getOrElse(() => current),
  )

export const update = Application.update((model, message) =>
  Message.match(message, {
    GotPersonalInfoMessage: ({ message }) => personalInfo.fold(model, message),

    GotWorkHistoryMessage: ({ message }) => workHistory.fold(model, message),

    GotEducationMessage: ({ message }) => education.fold(model, message),

    GotSkillsMessage: ({ message }) => skills.fold(model, message),

    GotCoverLetterMessage: ({ message }) => coverLetter.fold(model, message),

    GotAttachmentsMessage: ({ message }) => attachments.fold(model, message),

    GotStepMenuMessage: ({ message }) => stepMenu.fold(model, message),

    GotStepTabsMessage: ({ message }) => stepTabs.fold(model, message),

    ClickedNext: () => ({
      model: modifyFields(model, { currentStep: toNextStep }),
    }),

    ClickedPrevious: () => ({
      model: modifyFields(model, { currentStep: toPreviousStep }),
    }),

    ToggledPreview: () => ({
      model: modifyFields(model, { isPreviewVisible: isVisible => !isVisible }),
    }),

    ClickedSubmit: () => {
      const revealedModel = modifyFields(model, {
        personalInfo: revealPersonalInfoErrors,
        workHistory: revealWorkHistoryErrors,
        education: revealEducationErrors,
        skills: revealSkillsErrors,
        isSubmitAttempted: () => true,
      })
      if (isApplicationComplete(revealedModel)) {
        return {
          model: modifyFields(revealedModel, {
            submission: () => Submission.Submitting(),
          }),
          commands: [SubmitApplication()],
        }
      }
      return { model: revealedModel }
    },

    SucceededSubmitApplication: () => ({
      model: modifyFields(model, {
        submission: () => Submission.SubmitSuccess(),
      }),
    }),

    FailedSubmitApplication: ({ error }) => ({
      model: modifyFields(model, {
        submission: () => Submission.SubmitError({ error }),
      }),
    }),
  }),
)
