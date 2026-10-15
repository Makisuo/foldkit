import { Array } from 'effect'
import { type Block, type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Education, Message, type Model } from './definition'
import * as Entry from './entry'

const foldEntryOutMessage = (
  entryId: string,
  outMessage: typeof Entry.OutMessage.Type,
) =>
  Entry.OutMessage.match<Update.Step<Model, Message>>(outMessage, {
    Removed: () => model => ({
      model: modifyFields(model, {
        entries: Array.filter(entry => entry.id !== entryId),
      }),
    }),
  })

export const entries = Education.bindChild(Entry.block, {
  placement: 'EducationEntry',
  field: 'entries',
  key: 'id',
  toParentMessage: (entryId, message) =>
    Message.GotEntryMessage({ entryId, message }),
  outMessage: { fold: foldEntryOutMessage },
})

export const EducationComposition = Education.toComposition({
  children: [entries],
})
export type EducationViewBuilder = Block.ViewBuilderFor<
  typeof EducationComposition
>
