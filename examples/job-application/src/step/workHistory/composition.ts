import { Array, Option } from 'effect'
import { type Update } from 'foldkit'
import type { CalendarDate } from 'foldkit/calendar'
import { modifyFields } from 'foldkit/struct'

import { Message, type Model, WorkHistory } from './definition'
import * as Entry from './entry'

type Startup = Readonly<{ today: CalendarDate; initialEntryId: string }>

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

export const EntriesBinding = WorkHistory.bindChild(Entry.block, {
  field: 'entries',
  key: 'id',
  toParentMessage: (entryId, message) =>
    Message.GotEntryMessage({ entryId, message }),
  fromParentMessage: {
    parentMessage: Message.GotEntryMessage,
    args: (_model, { entryId, message }) => Option.some([entryId, message]),
  },
  init: {
    occurrences: ({ today, initialEntryId }: Startup) => [
      { key: initialEntryId, args: [initialEntryId, today] },
    ],
    toItem: (_occurrence, entry) => entry,
  },
  outMessage: { fold: foldEntryOutMessage },
})

export const WorkHistoryComposition = WorkHistory.toComposition({
  childBindings: [EntriesBinding],
})
