import { Option, Schema } from 'effect'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'
import * as BoundSettings from './boundSettings'

const Model = Schema.Struct({ settings: BoundSettings.Model })
type Model = typeof Model.Type
const Message = defineMessageUnion({ GotSettingsMessage: { message: BoundSettings.Message } })
const settings = BoundSettings.Settings.connection({
  read: (model: Model) => Option.some(model.settings),
  write: (model, nextSettings) => modifyFields(model, { settings: () => nextSettings }),
  toParentMessage: message => Message.GotSettingsMessage({ message }),
})
export const updateBinding = (model: Model, message: BoundSettings.Message) => {
  const settingsUpdate = settings.fold(model, message)
  return {
    model: modifyFields(model, {
      settings: currentSettings => modifyFields(currentSettings, { theme: () => 'Light' }),
    }),
    commands: settingsUpdate.commands,
  }
}
