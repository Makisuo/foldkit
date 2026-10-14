import { define as defineApplication } from 'foldkit/application'
import { Option, Schema } from 'effect'
import { Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'
import * as BoundSettings from './boundSettings'

const Model = Schema.Struct({ settings: BoundSettings.Model })
type Model = typeof Model.Type
const Message = defineMessageUnion({ GotSettingsMessage: { message: BoundSettings.Message } })
const ApplicationDefinition = defineApplication({ Model, Message })
const settings = ApplicationDefinition.bindChild(BoundSettings.Settings, {read: (model: Model) => Option.some(model.settings),
write: (model, nextSettings) => modifyFields(model, { settings: () => nextSettings }),
toParentMessage: message => Message.GotSettingsMessage({ message })})
export const updateBinding = (model: Model) =>
  Update.combine(model, [settings.setTheme('Light'), stepModel => ({ model: stepModel })])
