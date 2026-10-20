import { Array, Option } from 'effect'
import type { Block } from 'foldkit'

import { FileDropBlock } from '@foldkit/ui'

import { AttachmentsDefinition } from './definition'

export const ResumeDropBinding = AttachmentsDefinition.bindChild(
  FileDropBlock,
  {
    field: 'resumeDrop',
    init: { contextToArgs: () => [{ id: 'attachments-resume' }] },
  },
).withOutMessagePolicy({
  fold: AttachmentsDefinition.makeOutMessageFold(FileDropBlock, {
    ReceivedFiles: ({ files }) =>
      AttachmentsDefinition.stepFields(() => ({
        maybeResume: maybeResume =>
          Option.orElse(Array.head(files), () => maybeResume),
      })),
    RejectedNonFiles: AttachmentsDefinition.stepNoop,
  }),
})

export const AdditionalFilesDropBinding = AttachmentsDefinition.bindChild(
  FileDropBlock,
  {
    field: 'additionalFilesDrop',
    init: { contextToArgs: () => [{ id: 'attachments-additional' }] },
  },
).withOutMessagePolicy({
  fold: AttachmentsDefinition.makeOutMessageFold(FileDropBlock, {
    ReceivedFiles: ({ files }) =>
      AttachmentsDefinition.stepFields(() => ({
        additionalFiles: Array.appendAll(files),
      })),
    RejectedNonFiles: AttachmentsDefinition.stepNoop,
  }),
})

export const AttachmentsComposition = AttachmentsDefinition.makeComposition({
  bindings: [ResumeDropBinding, AdditionalFilesDropBinding],
})
export type AttachmentsViewBuilder = Block.ViewBuilderFor<
  typeof AttachmentsComposition
>
