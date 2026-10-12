import { Context, Effect, Schema } from 'effect'
import { Command, Submodel } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

// owner.ts
export const owner = Submodel.owner('Acme/Settings')

export const Theme = Schema.Literals(['Light', 'Dark', 'System'])
export type Theme = typeof Theme.Type

export const Model = Schema.Struct({ theme: Theme })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ChangedTheme: { theme: Theme },
  CompletedSaveTheme: {},
  FailedSaveTheme: {},
})

export const OutMessage = defineMessageUnion({
  ChangedTheme: { accountId: Schema.String, theme: Theme },
})

export class SettingsStore extends Context.Service<
  SettingsStore,
  Readonly<{ saveTheme: (theme: Theme) => Effect.Effect<void, Error> }>
>()('SettingsStore') {}

// command.ts
export const SaveTheme = Command.define(owner.name('SaveTheme'), {
  args: { theme: Theme },
  messages: [Message.CompletedSaveTheme, Message.FailedSaveTheme],
  handler: function* () {
    const settingsStore = yield* SettingsStore

    return ({ theme }) =>
      settingsStore.saveTheme(theme).pipe(
        Effect.as(Message.CompletedSaveTheme()),
        Effect.catch(() => Effect.succeed(Message.FailedSaveTheme())),
      )
  },
})

// definition.ts
export const contract = owner.define({ Model, Message, OutMessage })
