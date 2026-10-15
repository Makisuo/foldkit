import {
  attachments,
  coverLetter,
  education,
  personalInfo,
  skills,
  stepMenu,
  stepTabs,
  workHistory,
} from './composition'
import { Application } from './definition'
import type { Flags } from './flags'
import { Model, Submission } from './model'

export const init = Application.init(
  ({
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
  },
)
