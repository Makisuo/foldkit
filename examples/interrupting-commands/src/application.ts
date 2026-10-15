import { Array, Duration, Effect, Number, Option, Schema, pipe } from 'effect'
import { type Block, Command } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  Application,
  Message,
  type Model,
  Upload,
  type UploadStatus,
} from './definition'

export const ApplicationComposition = Application.toComposition()
export type ApplicationViewBuilder = Block.HtmlBuilderOf<
  typeof ApplicationComposition
>

export const initialModel: Model = {
  uploadId: 0,
  uploads: [],
}

export const init = () => ({
  model: initialModel,
})

// FAKE FILES

export const FakeFile = Schema.Struct({
  name: Schema.String,
  sizeMegabytes: Schema.Number,
})
export type FakeFile = typeof FakeFile.Type

export const FAKE_FILES: Array.NonEmptyReadonlyArray<FakeFile> = [
  { name: 'vacation-photos.zip', sizeMegabytes: 48 },
  { name: 'demo-recording.mp4', sizeMegabytes: 87 },
  { name: 'quarterly-report.pdf', sizeMegabytes: 12 },
  { name: 'design-assets.sketch', sizeMegabytes: 34 },
  { name: 'database-backup.sql', sizeMegabytes: 61 },
]

const fakeFileForUpload = (uploadId: number): FakeFile =>
  pipe(
    FAKE_FILES,
    Array.get(uploadId % Array.length(FAKE_FILES)),
    Option.getOrElse(() => Array.headNonEmpty(FAKE_FILES)),
  )

const MILLISECONDS_PER_MEGABYTE = 100

export const UploadKey = Schema.Struct({ uploadId: Schema.Number })
export type UploadKey = typeof UploadKey.Type

export const UploadFile = Application.command('UploadFile', {
  args: { ...UploadKey.fields, sizeMegabytes: Schema.Number },
  messages: [Message.CompletedUploadFile],
  interrupt: {
    keyFields: ['uploadId'],
    toKey: ({ uploadId }) => String(uploadId),
  },
  handler: function* () {
    return ({ uploadId, sizeMegabytes }) =>
      Effect.gen(function* () {
        yield* Effect.sleep(
          Duration.millis(sizeMegabytes * MILLISECONDS_PER_MEGABYTE),
        )
        return Message.CompletedUploadFile({ uploadId })
      })
  },
})

export const EffectsLayer = UploadFile.layer

export const CancelUploadFile = ({ uploadId }: UploadKey) =>
  UploadFile.Interrupt({ uploadId }, outcome =>
    Message.CompletedCancelUploadFile({ uploadId, outcome }),
  )

const setStatusForId = (uploadId: number, status: UploadStatus) =>
  Array.map((upload: Upload) =>
    upload.id === uploadId
      ? modifyFields(upload, { status: () => status })
      : upload,
  )

export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    ClickedStartUpload: () => {
      const fakeFile = fakeFileForUpload(model.uploadId)
      const startedUpload = Upload.make({
        id: model.uploadId,
        fileName: fakeFile.name,
        sizeMegabytes: fakeFile.sizeMegabytes,
        status: 'Uploading',
      })
      return {
        model: modifyFields(model, {
          uploadId: Number.increment,
          uploads: Array.append(startedUpload),
        }),
        commands: [
          UploadFile({
            uploadId: startedUpload.id,
            sizeMegabytes: startedUpload.sizeMegabytes,
          }),
        ],
      }
    },

    ClickedCancelUpload: ({ uploadId }) => ({
      model,
      commands: [CancelUploadFile({ uploadId })],
    }),

    ClickedCancelAllUploads: () => {
      return {
        model,
        commands: pipe(
          model.uploads,
          Array.filter(upload => upload.status === 'Uploading'),
          Array.map(upload => CancelUploadFile({ uploadId: upload.id })),
        ),
      }
    },

    ClickedRestartUpload: ({ uploadId }) =>
      pipe(
        model.uploads,
        Array.findFirst(
          upload => upload.id === uploadId && upload.status === 'Cancelled',
        ),
        Option.match({
          onNone: () => ({ model }),
          onSome: upload => ({
            model: modifyFields(model, {
              uploads: setStatusForId(uploadId, 'Uploading'),
            }),
            commands: [
              UploadFile({ uploadId, sizeMegabytes: upload.sizeMegabytes }),
            ],
          }),
        }),
      ),

    CompletedUploadFile: ({ uploadId }) => ({
      model: modifyFields(model, { uploads: setStatusForId(uploadId, 'Done') }),
    }),

    CompletedCancelUploadFile: ({ uploadId, outcome }) =>
      Command.Interruptible.Outcome.match(outcome, {
        Interrupted: () => ({
          model: modifyFields(model, {
            uploads: setStatusForId(uploadId, 'Cancelled'),
          }),
        }),
        NotFound: () => ({ model }),
      }),
  }),
)
