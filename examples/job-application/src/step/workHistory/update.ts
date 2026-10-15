import { Array } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { GenerateWorkHistoryEntryId } from './command'
import { entries } from './composition'
import { Message, type Model, WorkHistory } from './definition'
import * as Entry from './entry'

export const update = WorkHistory.update((model, message) =>
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
