import { Layer, Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

const BoundSettings = Block.define('BoundSettings')
export const Model = Schema.Struct({ theme: Schema.String })
export type Model = typeof Model.Type
export const Message = defineMessageUnion({ ChangedTheme: { theme: Schema.String } })
export type Message = typeof Message.Type
const settings = BoundSettings.define({ Model, Message })
export const setTheme = settings.step((model, theme: string) => ({
  model: modifyFields(model, { theme: () => theme }),
}))
const update = settings.update((model, message) =>
  Message.match(message, { ChangedTheme: ({ theme }) => setTheme(model, theme) }),
)
export const Settings = settings.toComposition().toBlock({
  init: () => ({ model: Model.make({ theme: 'System' }) }),
  update,
  expose: { setTheme },
  EffectsLayer: Layer.empty,
})
