import { Array, Crypto, Effect } from 'effect'
import { type Block, type Update } from 'foldkit'
import { type CalendarDate } from 'foldkit/calendar'
import { modifyFields } from 'foldkit/struct'

import { Education, Message, type Model } from './definition'
import * as Entry from './entry'

export const init = (today: CalendarDate, initialEntryId: string): Model => ({
  entries: [Entry.init(initialEntryId)],
  today,
})

export const GenerateEducationEntryId = Education.command(
  'GenerateEducationEntryId',
  {
    messages: [
      Message.SucceededGenerateEducationEntryId,
      Message.FailedGenerateEducationEntryId,
    ],
    handler: function* () {
      const crypto = yield* Crypto.Crypto

      return () =>
        crypto.randomUUIDv4.pipe(
          Effect.map(entryId =>
            Message.SucceededGenerateEducationEntryId({ entryId }),
          ),
          Effect.catch(() =>
            Effect.succeed(Message.FailedGenerateEducationEntryId()),
          ),
        )
    },
  },
)

export const EffectsLayer = GenerateEducationEntryId.layer

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

export type ViewBuilder = Block.HtmlBuilderOf<typeof EducationComposition>

export const update = Education.update((model, message) =>
  Message.match(message, {
    ClickedAddEntry: () => ({ model, commands: [GenerateEducationEntryId()] }),

    SucceededGenerateEducationEntryId: ({ entryId }) => {
      const entryInit = entries.init(entryId, entryId)
      return {
        model: modifyFields(model, {
          entries: Array.append(entryInit.model),
        }),
        commands: entryInit.commands,
      }
    },

    FailedGenerateEducationEntryId: () => ({ model }),

    RemovedEntry: ({ entryId }) => ({
      model: modifyFields(model, {
        entries: Array.filter(entry => entry.id !== entryId),
      }),
    }),

    GotEntryMessage: ({ entryId, message }) =>
      entries.fold(model, entryId, message),
  }),
)

export const hasErrors = (model: Model): boolean =>
  Array.some(model.entries, Entry.hasErrors)

export const isComplete = (model: Model): boolean =>
  Array.isReadonlyArrayNonEmpty(model.entries) &&
  Array.every(model.entries, Entry.isComplete)

export const revealErrors = (model: Model): Model =>
  modifyFields(model, { entries: Array.map(Entry.revealErrors) })
