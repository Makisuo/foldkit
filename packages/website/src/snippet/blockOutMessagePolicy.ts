import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Message, Model } from './blockProfileContract'
import * as Settings from './blockSettings'
import { Application } from './definition'

const foldSettingsOutMessage = Settings.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedTheme:
    ({ theme }) =>
    model => ({
      model: modifyFields(model, { previewTheme: () => theme }),
    }),
})

export const settings = Application.bindChild(Settings.block, {
  placement: 'Settings',
  field: 'maybeSettings',
  parentMessage: Message.GotSettingsMessage,
  outMessage: { fold: foldSettingsOutMessage },
})
