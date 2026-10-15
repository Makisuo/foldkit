import { type Block, Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Application } from './definition'
import { Message } from './message'
import { Model } from './model'
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
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
