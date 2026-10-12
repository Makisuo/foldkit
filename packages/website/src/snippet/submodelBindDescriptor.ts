import { Layer, Option } from 'effect'
import { modifyFields } from 'foldkit/struct'

import * as Settings from './submodelOwnedDescriptor'
import { Message, Model, owner } from './submodelProfileContract'

const settings = Settings.bind({
  placement: 'settings',
  read: (model: Model) => model.maybeSettings,
  write: (model, nextSettings) =>
    modifyFields(model, {
      maybeSettings: () => Option.some(nextSettings),
    }),
  toParentMessage: message => Message.GotSettingsMessage({ message }),
  outMessage: {
    fold: Settings.OutMessage.match({
      ChangedTheme:
        ({ theme }) =>
        (model: Model) => ({
          model: modifyFields(model, { previewTheme: () => theme }),
        }),
    }),
  },
})

const contract = owner.define({ Model, Message, children: [settings] })

const initialize = () => ({
  model: Model.make({
    currentUser: { accountId: 'account-1' },
    maybeSettings: Option.some(Settings.init().model),
    previewTheme: 'System',
  }),
})

const updateModel = contract.defineUpdate((model, message) =>
  Message.match(message, {
    GotSettingsMessage: ({ message }) =>
      settings.fold(model, message, model.currentUser),
  }),
)

export const view = contract.defineView((model, h) =>
  Option.match(model.maybeSettings, {
    onNone: () => h.empty,
    onSome: settingsModel =>
      h.submodel(
        settings.embed({
          slotId: 'settings',
          model: settingsModel,
        }),
      ),
  }),
)

// submodel.ts
const descriptor = contract.compose({
  init: initialize,
  update: updateModel,
  view,
  EffectsLayer: Layer.empty,
})

export const init = descriptor.init
export const update = descriptor.update
export const EffectsLayer = descriptor.EffectsLayer
export const subscriptions = descriptor.subscriptions
export const managedResources = descriptor.managedResources
export const mounts = descriptor.mounts

export { Message, Model } from './submodelProfileContract'
