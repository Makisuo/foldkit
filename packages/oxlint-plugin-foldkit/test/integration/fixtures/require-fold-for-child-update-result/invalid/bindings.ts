import { define as defineApplication } from 'foldkit/application'
import { Option, Schema } from 'effect'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import * as BoundSettings from './boundSettings'
import * as DirectBoundSettings from './boundSettings'
import * as KeyedBoundSettings from './boundSettings'

const Model = Schema.Struct({
  settings: BoundSettings.Model,
  directSettings: DirectBoundSettings.Model,
  keyedSettings: KeyedBoundSettings.Model,
})
type Model = typeof Model.Type
const Message = defineMessageUnion({
  GotSettingsMessage: { message: BoundSettings.Message },
})
const ApplicationDefinition = defineApplication({ Model, Message })
export const settings = ApplicationDefinition.bindChild(BoundSettings.Settings, {read: (model: Model) => Option.some(model.settings),
write: (model, nextSettings) =>
    modifyFields(model, { settings: () => nextSettings }),
toParentMessage: message => Message.GotSettingsMessage({ message })})
export const directSettings = ApplicationDefinition.bindChild(DirectBoundSettings.Settings, {field: 'directSettings',
parentMessage: Message.GotSettingsMessage})
export const keyedSettings = ApplicationDefinition.bindChild(KeyedBoundSettings.Settings, {readAll: (model: Model) => [model.keyedSettings],
key: () => 'settings',
read: settings => settings,
writeAt: (model, _key, nextSettings) =>
    modifyFields(model, { keyedSettings: () => nextSettings }),
toParentMessage: (_key, message) => Message.GotSettingsMessage({ message })})
export const updateBinding = (model: Model) => {
  const settingsTheme = BoundSettings.setTheme(model.settings, 'Light')
  return { model: modifyFields(model, { settings: () => settingsTheme.model }) }
}
export const updateDirectBinding = (model: Model) => {
  const settingsTheme = DirectBoundSettings.setTheme(
    model.directSettings,
    'Light',
  )
  return {
    model: modifyFields(model, { directSettings: () => settingsTheme.model }),
  }
}
export const updateKeyedBinding = (model: Model) => {
  const settingsTheme = KeyedBoundSettings.setTheme(
    model.keyedSettings,
    'Light',
  )
  return {
    model: modifyFields(model, { keyedSettings: () => settingsTheme.model }),
  }
}
