import { Schema } from 'effect'
import { Submodel } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

import * as Settings from './submodelOwnedDescriptor'

export const Model = Schema.Struct({
  currentUser: Schema.Struct({ accountId: Schema.String }),
  maybeSettings: Schema.Option(Settings.Model),
  previewTheme: Settings.Theme,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotSettingsMessage: { message: Settings.Message },
})

export const owner = Submodel.owner('Acme/Profile')
