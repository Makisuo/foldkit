import { Option } from 'effect'
import type { Update } from 'foldkit'
import { define as defineApplication } from 'foldkit/application'
import { modifyFields } from 'foldkit/struct'

import { Message, Model } from './blockProfileContract'
import * as Settings from './blockSettings'

const foldSettingsOutMessage = Settings.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedTheme:
    ({ theme }) =>
    model => ({
      model: modifyFields(model, { previewTheme: () => theme }),
    }),
})

export const settings = Settings.block.connection({
  read: (model: Model) => model.maybeSettings,
  write: (model, nextSettings) =>
    modifyFields(model, {
      maybeSettings: () => Option.some(nextSettings),
    }),
  parentMessage: Message.GotSettingsMessage,
  outMessage: { fold: foldSettingsOutMessage },
})

const ApplicationDefinition = defineApplication({ Model, Message })
export const Application = ApplicationDefinition.register({
  children: [settings],
})

export const init = () => {
  const settingsInit = settings.init()

  return {
    model: Model.make({
      currentUser: { accountId: 'account-1' },
      maybeSettings: Option.some(settingsInit.model),
      previewTheme: 'System',
    }),
    commands: settingsInit.commands,
  }
}

export const update = Application.update((model, message) =>
  Message.match(message, {
    GotSettingsMessage: ({ message }) =>
      settings.fold(model, message, model.currentUser),
  }),
)

export const view = Application.view((model, h) => ({
  title: 'Profile',
  body: Option.match(model.maybeSettings, {
    onNone: () => h.empty,
    onSome: settingsModel =>
      h.block(
        settings.embedView({
          slotId: 'settings',
          model: settingsModel,
        }),
      ),
  }),
}))

export { Message, Model }
