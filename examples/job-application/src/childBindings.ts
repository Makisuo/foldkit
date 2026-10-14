import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { ApplicationDefinition } from './definition'
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

export const personalInfo = ApplicationDefinition.bindChild(
  PersonalInfo.block,
  {
    field: 'personalInfo',
    parentMessage: Message.GotPersonalInfoMessage,
  },
)

export const workHistory = ApplicationDefinition.bindChild(WorkHistory.block, {
  field: 'workHistory',
  parentMessage: Message.GotWorkHistoryMessage,
})

export const education = ApplicationDefinition.bindChild(Education.block, {
  field: 'education',
  parentMessage: Message.GotEducationMessage,
})

export const skills = ApplicationDefinition.bindChild(Skills.block, {
  field: 'skills',
  parentMessage: Message.GotSkillsMessage,
})

export const coverLetter = ApplicationDefinition.bindChild(CoverLetter.block, {
  field: 'coverLetter',
  parentMessage: Message.GotCoverLetterMessage,
})

export const attachments = ApplicationDefinition.bindChild(Attachments.block, {
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

export const stepMenu = ApplicationDefinition.bindChild(StepMenu, {
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

export const stepTabs = ApplicationDefinition.bindChild(StepTabs, {
  field: 'stepTabs',
  parentMessage: Message.GotStepTabsMessage,
  outMessage: { fold: foldStepTabsOutMessage },
})
