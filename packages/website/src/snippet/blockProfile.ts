import { Option } from 'effect'
import { defineApplication } from 'foldkit'
import type { Update } from 'foldkit'
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

const Application = defineApplication({ Model, Message })

export const settings = Application.bindChild(Settings.block, {
  placement: 'Settings',
  field: 'maybeSettings',
  parentMessage: Message.GotSettingsMessage,
  outMessage: { fold: foldSettingsOutMessage },
})

export const ApplicationComposition = Application.toComposition({
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

export const view = ApplicationComposition.view((model, h) => ({
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
