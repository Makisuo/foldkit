import { Schema } from 'effect'
import { modifyFields } from 'foldkit/struct'

import * as Settings from './submodelOwnerContract'

const CurrentUser = Schema.Struct({ accountId: Schema.String })
type CurrentUser = typeof CurrentUser.Type

const updateModel = Settings.contract.defineUpdate(
  (model, message, currentUser: CurrentUser) =>
    Settings.Message.match(message, {
      ChangedTheme: ({ theme }) => ({
        model: modifyFields(model, { theme: () => theme }),
        commands: [Settings.SaveTheme({ theme })],
        outMessage: Settings.OutMessage.ChangedTheme({
          accountId: currentUser.accountId,
          theme,
        }),
      }),
      CompletedSaveTheme: () => ({ model }),
      FailedSaveTheme: () => ({ model }),
    }),
)

const reset = Settings.contract.defineStep(model => ({
  model: modifyFields(model, { theme: () => 'System' }),
}))

const view = Settings.contract.defineView((model, h) =>
  h.p([], [`Theme: ${model.theme}`]),
)

// submodel.ts
const descriptor = Settings.contract.compose({
  init: () => ({ model: Settings.Model.make({ theme: 'System' }) }),
  update: updateModel,
  view,
  steps: { reset },
  EffectsLayer: Settings.SaveTheme.layer,
})

export { Message, Model, OutMessage, Theme } from './submodelOwnerContract'
export type { CurrentUser }
export const bind = descriptor.bind
export const withEffectsLayer = descriptor.withEffectsLayer
export const init = descriptor.init
export const EffectsLayer = descriptor.EffectsLayer
export const subscriptions = descriptor.subscriptions
export const managedResources = descriptor.managedResources
export const mounts = descriptor.mounts
