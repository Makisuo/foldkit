import { Option, Schema } from 'effect'
import { Update, defineApplication } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'
import * as BoundSettings from './boundSettings'

const Model = Schema.Struct({ settings: BoundSettings.Model })
type Model = typeof Model.Type
const Message = defineMessageUnion({ GotSettingsMessage: { message: BoundSettings.Message } })
const Application = defineApplication({ Model, Message })
const SettingsBinding = Application.bindChild(BoundSettings.Settings, {read: (model: Model) => Option.some(model.settings),
write: (model, nextSettings) => modifyFields(model, { settings: () => nextSettings }),
parentMessage: Message.GotSettingsMessage,
fromParentMessage: {
  parentMessage: Message.GotSettingsMessage,
  args: (_model, { message }) => Option.some([message]),
}})
export const updateBinding = (model: Model) =>
  Update.combine(model, [SettingsBinding.setTheme('Light'), stepModel => ({ model: stepModel })])
