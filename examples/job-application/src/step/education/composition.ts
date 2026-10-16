import { Array, Option } from 'effect'
import { type Block, type Update } from 'foldkit'
import type { CalendarDate } from 'foldkit/calendar'
import { modifyFields } from 'foldkit/struct'

import { Education, Message, type Model } from './definition'
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

export const EntriesBinding = Education.bindChild(Entry.block, {
  field: 'entries',
  key: 'id',
  toParentMessage: (entryId, message) =>
    Message.GotEntryMessage({ entryId, message }),
  fromParentMessage: {
    parentMessage: Message.GotEntryMessage,
    args: (_model, { entryId, message }) => Option.some([entryId, message]),
  },
  init: {
    occurrences: ({ initialEntryId }: Startup) => [
      { key: initialEntryId, args: [initialEntryId] },
    ],
    toItem: (_occurrence, entry) => entry,
  },
  outMessage: { fold: foldEntryOutMessage },
})

export const EducationComposition = Education.toComposition({
  childBindings: [EntriesBinding],
})
export type EducationViewBuilder = Block.ViewBuilderFor<
  typeof EducationComposition
>
