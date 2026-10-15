import { Schema } from 'effect'
import { Command, defineApplication } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

export const UploadStatus = Schema.Literals(['Uploading', 'Done', 'Cancelled'])
export type UploadStatus = typeof UploadStatus.Type

export const Upload = Schema.Struct({
  id: Schema.Number,
  fileName: Schema.String,
  sizeMegabytes: Schema.Number,
  status: UploadStatus,
})
export type Upload = typeof Upload.Type

export const Model = Schema.Struct({
  uploadId: Schema.Number,
  uploads: Schema.Array(Upload),
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ClickedStartUpload: {},
  ClickedCancelUpload: { uploadId: Schema.Number },
  ClickedCancelAllUploads: {},
  ClickedRestartUpload: { uploadId: Schema.Number },
  CompletedUploadFile: { uploadId: Schema.Number },
  CompletedCancelUploadFile: {
    uploadId: Schema.Number,
    outcome: Command.Interruptible.Outcome,
  },
})

export type Message = typeof Message.Type

export const Application = defineApplication({ Model, Message })
