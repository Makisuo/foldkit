import { Effect, Schema, Stream } from 'effect'
import { Dom, Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

// MESSAGE

const Message = defineMessageUnion({
  PressedKey: { key: Schema.String },
})
type Message = typeof Message.Type

// MODEL

const Model = Schema.Struct({
  isListening: Schema.Boolean,
})
type Model = typeof Model.Type

// SUBSCRIPTION

const Shortcuts = Block.define('Shortcuts', { Model, Message })

const subscriptions = Shortcuts.subscriptions(entry => ({
  shortcutKeyPresses: entry(
    'ShortcutKeyPresses',
    { isListening: Schema.Boolean },
    {
      messages: [Message.PressedKey],
      modelToDependencies: model => ({ isListening: model.isListening }),
      handler: function* () {
        return ({ isListening }) =>
          Stream.when(
            Dom.streamFromEvent({
              target: window,
              type: 'keydown',
              mapEvent: event => Message.PressedKey({ key: event.key }),
            }),
            Effect.sync(() => isListening),
          )
      },
    },
  ),
}))
