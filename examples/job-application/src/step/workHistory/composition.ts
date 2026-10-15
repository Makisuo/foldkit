import { Array } from 'effect'
import { type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Message, type Model, WorkHistory } from './definition'
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

export const entries = WorkHistory.bindChild(Entry.block, {
  placement: 'WorkHistoryEntry',
  field: 'entries',
  key: 'id',
  toParentMessage: (entryId, message) =>
    Message.GotEntryMessage({ entryId, message }),
  outMessage: { fold: foldEntryOutMessage },
})

export const WorkHistoryComposition = WorkHistory.toComposition({
  children: [entries],
})
