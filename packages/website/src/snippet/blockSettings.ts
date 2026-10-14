import { Schema } from 'effect'
import { modifyFields } from 'foldkit/struct'

import {
  Message,
  Model,
  OutMessage,
  SaveTheme,
  SettingsDefinition,
  Theme,
} from './blockDefinition'

const CurrentUser = Schema.Struct({ accountId: Schema.String })
export type CurrentUser = typeof CurrentUser.Type

const update = SettingsDefinition.update(
  (model, message, currentUser: CurrentUser) =>
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

const reset = SettingsDefinition.step(model => ({
  model: modifyFields(model, { theme: () => 'System' }),
}))

const view = SettingsDefinition.view((model, h) =>
  h.p([], [`Theme: ${model.theme}`]),
)

export const block = SettingsDefinition.toComposition().toBlock({
  init: () => ({ model: Model.make({ theme: 'System' }) }),
  update,
  view,
  expose: { reset },
  EffectsLayer: SaveTheme.layer,
})

export { Message, Model, OutMessage, Theme }
