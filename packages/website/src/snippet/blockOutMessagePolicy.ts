import { Option } from 'effect'
import { Update } from 'foldkit'
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
    modifyFields(model, { maybeSettings: () => Option.some(nextSettings) }),
  parentMessage: Message.GotSettingsMessage,
  outMessage: { fold: foldSettingsOutMessage },
})
