import { Array, Crypto, Effect } from 'effect'
import { type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Message, type Model, Skills } from './definition'
import * as Entry from './entry'

export const init = (initialEntryId: string): Model => ({
  entries: [Entry.init(initialEntryId)],
})

export const GenerateSkillsEntryId = Skills.command('GenerateSkillsEntryId', {
  messages: [
    Message.SucceededGenerateSkillsEntryId,
    Message.FailedGenerateSkillsEntryId,
  ],
  handler: function* () {
    const crypto = yield* Crypto.Crypto

    return () =>
      crypto.randomUUIDv4.pipe(
        Effect.map(entryId =>
          Message.SucceededGenerateSkillsEntryId({ entryId }),
        ),
        Effect.catch(() =>
          Effect.succeed(Message.FailedGenerateSkillsEntryId()),
        ),
      )
  },
})

export const EffectsLayer = GenerateSkillsEntryId.layer

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

export const entries = Skills.bindChild(Entry.block, {
  placement: 'SkillsEntry',
  field: 'entries',
  key: 'id',
  toParentMessage: (entryId, message) =>
    Message.GotEntryMessage({ entryId, message }),
  outMessage: { fold: foldEntryOutMessage },
})

export const SkillsComposition = Skills.toComposition({
  children: [entries],
})

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
