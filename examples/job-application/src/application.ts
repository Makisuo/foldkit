import { Crypto, Effect, Schema } from 'effect'
import { Calendar } from 'foldkit'

import {
  attachments,
  coverLetter,
  education,
  Application,
  personalInfo,
  skills,
  stepMenu,
  stepTabs,
  workHistory,
} from './children'
import { SubmitApplication } from './command'
import { Message } from './message'
import { Model, Submission } from './model'
import { update } from './update'
import { view } from './view/view'

// FLAGS

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

// INIT

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

export const implementation = {
  init,
  update,
  view,
  EffectsLayer: SubmitApplication.layer,
}

export { Message, Model, update, view }

export { Application }
