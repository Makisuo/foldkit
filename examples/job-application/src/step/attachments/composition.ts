import { Array, Option } from 'effect'
import { type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { FileDrop } from '@foldkit/ui'

import { AttachmentsDefinition, Message, type Model } from './definition'

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

export const ResumeDropBinding = AttachmentsDefinition.bindChild(
  FileDrop.block,
  {
    field: 'resumeDrop',
    parentMessage: Message.GotResumeDropMessage,
    init: { startupToArgs: () => [{ id: 'attachments-resume' }] },
    outMessage: { fold: foldResumeDropOutMessage },
  },
)

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

export const AdditionalFilesDropBinding = AttachmentsDefinition.bindChild(
  FileDrop.block,
  {
    field: 'additionalFilesDrop',
    parentMessage: Message.GotAdditionalFilesDropMessage,
    init: { startupToArgs: () => [{ id: 'attachments-additional' }] },
    outMessage: { fold: foldAdditionalFilesDropOutMessage },
  },
)

export const AttachmentsComposition = AttachmentsDefinition.makeComposition({
  childBindings: [ResumeDropBinding, AdditionalFilesDropBinding],
})
