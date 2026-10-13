// page/settings.ts
import { Schema } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

// MODEL

export const Theme = Schema.Literals(['Light', 'Dark', 'System'])
export type Theme = typeof Theme.Type

export const FontSize = Schema.Literals(['Small', 'Medium', 'Large'])
export type FontSize = typeof FontSize.Type

export const Model = Schema.Struct({
  theme: Theme,
  fontSize: FontSize,
  notificationsEnabled: Schema.Boolean,
})
export type Model = typeof Model.Type

// MESSAGE

export const Message = defineMessageUnion({
  ChangedTheme: { theme: Theme },
  ChangedFontSize: { fontSize: FontSize },
  ToggledNotifications: {},
})
export type Message = typeof Message.Type

export const Settings = Block.define('Settings', { Model, Message })

// UPDATE

export const update = Settings.update((model, message) =>
  Message.match(message, {
    ChangedTheme: ({ theme }) => ({
      model: modifyFields(model, { theme: () => theme }),
    }),
    ChangedFontSize: ({ fontSize }) => ({
      model: modifyFields(model, { fontSize: () => fontSize }),
    }),
    ToggledNotifications: () => ({
      model: modifyFields(model, { notificationsEnabled: enabled => !enabled }),
    }),
  }),
)
