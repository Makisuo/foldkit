import { Layer, Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

const KeyedEntry = Block.define('RequireFoldKeyedEntry')
export const Model = Schema.Struct({ id: Schema.String, theme: Schema.String })
export type Model = typeof Model.Type
export const Message = defineMessageUnion({
  ChangedTheme: { theme: Schema.String },
})
export type Message = typeof Message.Type
const entry = KeyedEntry.define({ Model, Message })
export const setTheme = entry.step((model, theme: string) => ({
  model: modifyFields(model, { theme: () => theme }),
}))
const update = entry.update((model, message) =>
  Message.match(message, {
    ChangedTheme: ({ theme }) => setTheme(model, theme),
  }),
)
export const Entry = entry.toComposition().toBlock({
  init: () => ({ model: Model.make({ id: 'initial', theme: 'System' }) }),
  update,
  expose: { setTheme },
  EffectsLayer: Layer.empty,
})
