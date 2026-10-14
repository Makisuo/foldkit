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

export const personalInfo = PersonalInfo.block.connection({
  Model: Model,
  field: 'personalInfo',
  parentMessage: Message.GotPersonalInfoMessage,
})

export const workHistory = WorkHistory.block.connection({
  Model: Model,
  field: 'workHistory',
  parentMessage: Message.GotWorkHistoryMessage,
})

export const education = Education.block.connection({
  Model: Model,
  field: 'education',
  parentMessage: Message.GotEducationMessage,
})

export const skills = Skills.block.connection({
  Model: Model,
  field: 'skills',
  parentMessage: Message.GotSkillsMessage,
})

export const coverLetter = CoverLetter.block.connection({
  Model: Model,
  field: 'coverLetter',
  parentMessage: Message.GotCoverLetterMessage,
})

export const attachments = Attachments.block.connection({
  Model: Model,
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

export const stepMenu = StepMenu.connection({
  Model: Model,
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

export const stepTabs = StepTabs.connection({
  Model: Model,
  field: 'stepTabs',
  parentMessage: Message.GotStepTabsMessage,
  outMessage: { fold: foldStepTabsOutMessage },
})

export const Application = ApplicationDefinition.register({
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
