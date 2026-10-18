import { Option, Schema } from 'effect'
import { makeApplicationDefinition } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'
import * as BoundSettings from './boundSettings'

const Model = Schema.Struct({ settings: BoundSettings.Model })
type Model = typeof Model.Type
const Message = defineMessageUnion({
  GotSettingsMessage: { message: BoundSettings.Message },
  ClickedApplyTheme: {},
})
const ApplicationDefinition = makeApplicationDefinition({ Model, Message })
const SettingsBinding = ApplicationDefinition.bindChild(BoundSettings.Settings, {read: (model: Model) => Option.some(model.settings),
write: (model, nextSettings) => modifyFields(model, { settings: () => nextSettings }),
parentMessage: Message.GotSettingsMessage,
fromParentMessage: {
  parentMessage: Message.GotSettingsMessage,
  args: (_model, { message }) => Option.some([message]),
}})
const ApplicationComposition = ApplicationDefinition.makeComposition({ bindings: [SettingsBinding] })
export const updateBinding = ApplicationComposition.makeUpdate(model =>
  SettingsBinding.informThemeChanged({ theme: 'Light' })(model)
)
