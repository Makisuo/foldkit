import { Array } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { GenerateSkillsEntryId } from './command'
import { entries } from './composition'
import { Message, type Model, Skills } from './definition'
import * as Entry from './entry'

export const update = Skills.update((model, message) =>
  Message.match(message, {
    ClickedAddEntry: () => ({ model, commands: [GenerateSkillsEntryId()] }),

    SucceededGenerateSkillsEntryId: ({ entryId }) => {
      const entryInit = entries.init(entryId, entryId)
      return {
        model: modifyFields(model, {
          entries: Array.append(entryInit.model),
        }),
        commands: entryInit.commands,
      }
    },

    FailedGenerateSkillsEntryId: () => ({ model }),

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
