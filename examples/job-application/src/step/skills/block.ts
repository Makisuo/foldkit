import { Array, Crypto, Effect, Schema } from 'effect'
import { Block, type Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import * as Entry from './entry'

// MODEL

export const Model = Schema.Struct({
  entries: Schema.Array(Entry.Model),
})
export type Model = typeof Model.Type

// MESSAGE

export const Message = defineMessageUnion({
  ClickedAddEntry: {},
  SucceededGenerateSkillsEntryId: { entryId: Schema.String },
  FailedGenerateSkillsEntryId: {},
  RemovedEntry: { entryId: Schema.String },
  GotEntryMessage: {
    entryId: Schema.String,
    message: Entry.Message,
  },
})

export type Message = typeof Message.Type

const Skills = Block.define('Skills', {
  Model,
  Message,
})

// INIT

export const init = (initialEntryId: string): Model => ({
  entries: [Entry.init(initialEntryId)],
})

// COMMAND

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

// UPDATE

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

export const entries = Entry.block.keyedConnection({
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

export const skills = Skills.register({ children: [entries] })

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

// VALIDATION SUMMARY

export const hasErrors = (model: Model): boolean =>
  Array.some(model.entries, Entry.hasErrors)

export const isComplete = (model: Model): boolean =>
  Array.isReadonlyArrayNonEmpty(model.entries) &&
  Array.every(model.entries, Entry.isComplete)

export const revealErrors = (model: Model): Model =>
  modifyFields(model, { entries: Array.map(Entry.revealErrors) })
