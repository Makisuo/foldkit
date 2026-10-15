import { Crypto, Effect, Schema } from 'effect'
import { type Block, Update } from 'foldkit'
import { Calendar } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { SubmitApplication } from './command'
import { Application } from './definition'
import { Message } from './message'
import { Model, Submission } from './model'
import { StepMenu, StepTabs } from './navigationComponents'
import {
  Attachments,
  CoverLetter,
  Education,
  PersonalInfo,
  Skills,
  WorkHistory,
} from './step'

export const personalInfo = Application.bindChild(PersonalInfo.block, {
  field: 'personalInfo',
  parentMessage: Message.GotPersonalInfoMessage,
})

export const workHistory = Application.bindChild(WorkHistory.block, {
  field: 'workHistory',
  parentMessage: Message.GotWorkHistoryMessage,
})

export const education = Application.bindChild(Education.block, {
  field: 'education',
  parentMessage: Message.GotEducationMessage,
})

export const skills = Application.bindChild(Skills.block, {
  field: 'skills',
  parentMessage: Message.GotSkillsMessage,
})

export const coverLetter = Application.bindChild(CoverLetter.block, {
  field: 'coverLetter',
  parentMessage: Message.GotCoverLetterMessage,
})

export const attachments = Application.bindChild(Attachments.block, {
  field: 'attachments',
  parentMessage: Message.GotAttachmentsMessage,
})

const foldStepMenuOutMessage = StepMenu.OutMessage.match<
  Update.Step<Model, Message>,
  typeof StepMenu.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { currentStep: () => value }),
    }),
})

export const stepMenu = Application.bindChild(StepMenu, {
  field: 'stepMenu',
  parentMessage: Message.GotStepMenuMessage,
  outMessage: { fold: foldStepMenuOutMessage },
})

const foldStepTabsOutMessage = StepTabs.OutMessage.match<
  Update.Step<Model, Message>,
  typeof StepTabs.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { currentStep: () => value }),
    }),
})

export const stepTabs = Application.bindChild(StepTabs, {
  field: 'stepTabs',
  parentMessage: Message.GotStepTabsMessage,
  outMessage: { fold: foldStepTabsOutMessage },
})

export const Flags = Schema.Struct({
  today: Calendar.CalendarDate,
  initialWorkHistoryEntryId: Schema.String,
  initialEducationEntryId: Schema.String,
  initialSkillsEntryId: Schema.String,
})
export type Flags = typeof Flags.Type

export const flags = Effect.gen(function* () {
  const crypto = yield* Crypto.Crypto

  const today = yield* Calendar.today.local
  const initialWorkHistoryEntryId = yield* Effect.orDie(crypto.randomUUIDv4)
  const initialEducationEntryId = yield* Effect.orDie(crypto.randomUUIDv4)
  const initialSkillsEntryId = yield* Effect.orDie(crypto.randomUUIDv4)

  return {
    today,
    initialWorkHistoryEntryId,
    initialEducationEntryId,
    initialSkillsEntryId,
  }
})

export const init = ({
  today,
  initialWorkHistoryEntryId,
  initialEducationEntryId,
  initialSkillsEntryId,
}: Flags) => {
  const personalInfoInit = personalInfo.init(today)
  const workHistoryInit = workHistory.init(today, initialWorkHistoryEntryId)
  const educationInit = education.init(today, initialEducationEntryId)
  const skillsInit = skills.init(initialSkillsEntryId)
  const coverLetterInit = coverLetter.init()
  const attachmentsInit = attachments.init()
  const stepMenuInit = stepMenu.init({ id: 'step-menu' })
  const stepTabsInit = stepTabs.init({ id: 'step-tabs' })

  return {
    model: Model.make({
      currentStep: 'PersonalInfo',
      personalInfo: personalInfoInit.model,
      workHistory: workHistoryInit.model,
      education: educationInit.model,
      skills: skillsInit.model,
      coverLetter: coverLetterInit.model,
      attachments: attachmentsInit.model,
      isPreviewVisible: false,
      submission: Submission.NotSubmitted(),
      stepMenu: stepMenuInit.model,
      stepTabs: stepTabsInit.model,
      isSubmitAttempted: false,
    }),
    commands: [
      ...(personalInfoInit.commands ?? []),
      ...(workHistoryInit.commands ?? []),
      ...(educationInit.commands ?? []),
      ...(skillsInit.commands ?? []),
      ...(coverLetterInit.commands ?? []),
      ...(attachmentsInit.commands ?? []),
      ...(stepMenuInit.commands ?? []),
      ...(stepTabsInit.commands ?? []),
    ],
  }
}

export const EffectsLayer = SubmitApplication.layer

export const ApplicationComposition = Application.toComposition({
  children: [
    personalInfo,
    workHistory,
    education,
    skills,
    coverLetter,
    attachments,
    stepMenu,
    stepTabs,
  ],
})

export type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>
