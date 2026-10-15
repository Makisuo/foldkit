import { Schema } from 'effect'
import { modifyFields } from 'foldkit/struct'

import {
  Message,
  Model,
  OutMessage,
  SaveTheme,
  Settings,
  SettingsComposition,
  Theme,
} from './blockDefinition'

const CurrentUser = Schema.Struct({ accountId: Schema.String })
export type CurrentUser = typeof CurrentUser.Type

const update = Settings.update((model, message, currentUser: CurrentUser) =>
  Message.match(message, {
    ChangedTheme: ({ theme }) => ({
      model: modifyFields(model, { theme: () => theme }),
      commands: [SaveTheme({ theme })],
      outMessage: OutMessage.ChangedTheme({
        accountId: currentUser.accountId,
        theme,
      }),
    }),
    CompletedSaveTheme: () => ({ model }),
    FailedSaveTheme: () => ({ model }),
  }),
)

const reset = Settings.step(model => ({
  model: modifyFields(model, { theme: () => 'System' }),
}))

const view = SettingsComposition.view((model, h) =>
  h.p([], [`Theme: ${model.theme}`]),
)

const init = Settings.init(() => ({
  model: Model.make({ theme: 'System' }),
}))

export const block = SettingsComposition.toBlock({
  init,
  update,
  view,
  expose: { reset },
  EffectsLayer: SaveTheme.layer,
})

export { Message, Model, OutMessage, Theme }
