import { Array, Option, Schema } from 'effect'
import { Block, File, Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { FileDrop } from '@foldkit/ui'

export const Model = Schema.Struct({
  resumeDrop: FileDrop.Model,
  maybeResume: Schema.Option(File.File),
  additionalFilesDrop: FileDrop.Model,
  additionalFiles: Schema.Array(File.File),
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotResumeDropMessage: { message: FileDrop.Message },
  GotAdditionalFilesDropMessage: { message: FileDrop.Message },
  RemovedResume: {},
  RemovedAdditionalFile: { fileIndex: Schema.Number },
})

export type Message = typeof Message.Type

export const init = (): Model => ({
  resumeDrop: FileDrop.init({ id: 'attachments-resume' }),
  maybeResume: Option.none(),
  additionalFilesDrop: FileDrop.init({ id: 'attachments-additional' }),
  additionalFiles: [],
})

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

const AttachmentsDefinition = Block.define('Attachments', {
  Model,
  Message,
})

export const resumeDrop = AttachmentsDefinition.bindChild(FileDrop.block, {
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

export const additionalFilesDrop = AttachmentsDefinition.bindChild(
  FileDrop.block,
  {
    placement: 'attachments-additional',
    field: 'additionalFilesDrop',
    parentMessage: Message.GotAdditionalFilesDropMessage,
    outMessage: { fold: foldAdditionalFilesDropOutMessage },
  },
)

export const AttachmentsComposition = AttachmentsDefinition.toComposition({
  children: [resumeDrop, additionalFilesDrop],
})

export const update = AttachmentsDefinition.update((model, message) =>
  Message.match(message, {
    GotResumeDropMessage: ({ message }) => resumeDrop.fold(model, message),

    GotAdditionalFilesDropMessage: ({ message }) =>
      additionalFilesDrop.fold(model, message),

    RemovedResume: () => ({
      model: modifyFields(model, { maybeResume: () => Option.none() }),
    }),

    RemovedAdditionalFile: ({ fileIndex }) => ({
      model: modifyFields(model, {
        additionalFiles: Array.remove(fileIndex),
      }),
    }),
  }),
)
