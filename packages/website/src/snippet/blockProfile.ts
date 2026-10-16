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

export const SettingsBinding = Application.bindChild(Settings.block, {
  field: 'maybeSettings',
  parentMessage: Message.GotSettingsMessage,
  fromParentMessage: {
    parentMessage: Message.GotSettingsMessage,
    args: (model, { message }) => Option.some([message, model.currentUser]),
  },
  outMessage: { fold: foldSettingsOutMessage },
  init: true,
})

export const ApplicationComposition = Application.toComposition({
  childBindings: [SettingsBinding],
})

export const init = ApplicationComposition.init(() => ({
  model: {
    currentUser: { accountId: 'account-1' },
    previewTheme: 'System',
  },
}))

export const update = ApplicationComposition.update()

export const view = ApplicationComposition.view((model, h) => ({
  title: 'Profile',
  body: Option.match(model.maybeSettings, {
    onNone: () => h.empty,
    onSome: settingsModel =>
      h.block(
        SettingsBinding.embedView({
          slotId: 'settings',
          model: settingsModel,
        }),
      ),
  }),
}))

export { Message, Model }
