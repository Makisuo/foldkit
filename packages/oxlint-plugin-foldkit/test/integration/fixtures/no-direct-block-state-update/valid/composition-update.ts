import { Schema } from 'effect'
import { makeApplicationDefinition } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import * as BoundSettings from './boundSettings'

const Model = Schema.Struct({ settings: BoundSettings.Model })
const Message = defineMessageUnion({
  GotSettingsMessage: { message: BoundSettings.Message },
})
const ApplicationDefinition = makeApplicationDefinition({ Model, Message })
const SettingsBinding = ApplicationDefinition.bindChild(BoundSettings.Settings, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
  init: true,
})
ApplicationDefinition.makeComposition({ bindings: [SettingsBinding] })

const OtherMessage = defineMessageUnion({ ChangedTheme: {} })
const OtherApplication = makeApplicationDefinition({ Model, Message: OtherMessage })
const OtherApplicationComposition = OtherApplication.makeComposition()

export const update = OtherApplicationComposition.makeUpdate(model => ({
  model: modifyFields(model, {
    settings: settings =>
      modifyFields(settings, { theme: () => 'Light' }),
  }),
}))
