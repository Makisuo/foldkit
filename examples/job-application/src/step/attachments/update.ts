import { Array, Option } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { additionalFilesDrop, resumeDrop } from './composition'
import { Attachments, Message } from './definition'

export const update = Attachments.update((model, message) =>
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
