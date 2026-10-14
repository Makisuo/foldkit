import { Array, Crypto, Effect, Schema } from 'effect'
import { Block, Calendar, type Update } from 'foldkit'
import { type CalendarDate } from 'foldkit/calendar'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import * as Entry from './entry'

export const Model = Schema.Struct({
  entries: Schema.Array(Entry.Model),
  today: Calendar.CalendarDate,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ClickedAddEntry: {},
  SucceededGenerateWorkHistoryEntryId: { entryId: Schema.String },
  FailedGenerateWorkHistoryEntryId: {},
  RemovedEntry: { entryId: Schema.String },
  GotEntryMessage: {
    entryId: Schema.String,
    message: Entry.Message,
  },
})

export type Message = typeof Message.Type

const WorkHistoryDefinition = Block.define('WorkHistory', {
  Model,
  Message,
})

export const init = (today: CalendarDate, initialEntryId: string): Model => ({
  entries: [Entry.init(initialEntryId, today)],
  today,
})

export const GenerateWorkHistoryEntryId = WorkHistoryDefinition.command(
  'GenerateWorkHistoryEntryId',
  {
    messages: [
      Message.SucceededGenerateWorkHistoryEntryId,
      Message.FailedGenerateWorkHistoryEntryId,
    ],
    handler: function* () {
      const crypto = yield* Crypto.Crypto

      return () =>
        crypto.randomUUIDv4.pipe(
          Effect.map(entryId =>
            Message.SucceededGenerateWorkHistoryEntryId({ entryId }),
          ),
          Effect.catch(() =>
            Effect.succeed(Message.FailedGenerateWorkHistoryEntryId()),
          ),
        )
    },
  },
)

export const EffectsLayer = GenerateWorkHistoryEntryId.layer

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

export const entries = WorkHistoryDefinition.bindChild(Entry.block, {
  readAll: (model: Model) => model.entries,
  key: (entry: typeof Entry.Model.Type) => entry.id,
  read: entry => entry,
  writeAt: (model, entryId, nextEntry) =>
    modifyFields(model, {
      entries: Array.map(entry => (entry.id === entryId ? nextEntry : entry)),
    }),
  toParentMessage: (entryId, message) =>
    Message.GotEntryMessage({ entryId, message }),
  outMessage: { fold: foldEntryOutMessage },
})

export const WorkHistoryComposition = WorkHistoryDefinition.toComposition({
  children: [entries],
})

export const update = WorkHistoryDefinition.update((model, message) =>
  Message.match(message, {
    ClickedAddEntry: () => ({
      model,
      commands: [GenerateWorkHistoryEntryId()],
    }),

    SucceededGenerateWorkHistoryEntryId: ({ entryId }) => {
      const entryInit = entries.init(entryId, entryId, model.today)
      return {
        model: modifyFields(model, {
          entries: Array.append(entryInit.model),
        }),
        commands: entryInit.commands,
      }
    },

    FailedGenerateWorkHistoryEntryId: () => ({ model }),

    RemovedEntry: ({ entryId }) => ({
      model: modifyFields(model, {
        entries: Array.filter(entry => entry.id !== entryId),
      }),
    }),

    GotEntryMessage: ({ entryId, message }) =>
      entries.fold(model, entryId, message),
  }),
)

// VALIDATION SUMMARY

export const hasErrors = (model: Model): boolean =>
  Array.some(model.entries, Entry.hasErrors)

export const isComplete = (model: Model): boolean =>
  Array.isReadonlyArrayNonEmpty(model.entries) &&
  Array.every(model.entries, Entry.isComplete)

export const revealErrors = (model: Model): Model =>
  modifyFields(model, { entries: Array.map(Entry.revealErrors) })
