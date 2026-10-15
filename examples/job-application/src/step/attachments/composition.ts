import { Array, Option } from 'effect'
import { type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { FileDrop } from '@foldkit/ui'

import { Attachments, Message, type Model } from './definition'

const foldResumeDropOutMessage = FileDrop.OutMessage.match<
  Update.Step<Model, Message>
>({
  ReceivedFiles:
    ({ files }) =>
    model => ({
      model: modifyFields(model, {
        maybeResume: () =>
          Option.orElse(Array.head(files), () => model.maybeResume),
      }),
    }),
  RejectedNonFiles: () => model => ({ model }),
})

export const resumeDrop = Attachments.bindChild(FileDrop.block, {
  placement: 'attachments-resume',
  field: 'resumeDrop',
  parentMessage: Message.GotResumeDropMessage,
  outMessage: { fold: foldResumeDropOutMessage },
})

const foldAdditionalFilesDropOutMessage = FileDrop.OutMessage.match<
  Update.Step<Model, Message>
>({
  ReceivedFiles:
    ({ files }) =>
    model => ({
      model: modifyFields(model, {
        additionalFiles: Array.appendAll(files),
      }),
    }),
  RejectedNonFiles: () => model => ({ model }),
})

export const additionalFilesDrop = Attachments.bindChild(FileDrop.block, {
  placement: 'attachments-additional',
  field: 'additionalFilesDrop',
  parentMessage: Message.GotAdditionalFilesDropMessage,
  outMessage: { fold: foldAdditionalFilesDropOutMessage },
})

export const AttachmentsComposition = Attachments.toComposition({
  children: [resumeDrop, additionalFilesDrop],
})
