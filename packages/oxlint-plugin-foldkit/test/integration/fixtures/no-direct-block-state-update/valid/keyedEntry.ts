import { Layer, Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

export const Model = Schema.Struct({ id: Schema.String, theme: Schema.String })
export type Model = typeof Model.Type
export const Message = defineMessageUnion({
  InformedOfThemeChange: { theme: Schema.String },
})
export type Message = typeof Message.Type
const KeyedEntry = Block.define('NoDirectStateKeyedEntry', { Model, Message })
const KeyedEntryComposition = KeyedEntry.makeComposition()
const init = KeyedEntryComposition.makeInit(() => ({
  model: Model.make({ id: 'initial', theme: 'System' }),
}))
const update = KeyedEntryComposition.makeUpdate((model, message) =>
  Message.match(message, {
    InformedOfThemeChange: ({ theme }) => ({
      model: modifyFields(model, { theme: () => theme }),
    }),
  }),
)
export const Entry = KeyedEntryComposition.makeBlock({
  init,
  update,
  operations: {
    informThemeChanged: Message.InformedOfThemeChange,
  },
  EffectsLayer: Layer.empty,
})
