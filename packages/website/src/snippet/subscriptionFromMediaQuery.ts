import { Schema } from 'effect'
import { Dom, Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

// MESSAGE

const Message = defineMessageUnion({
  ChangedReducedMotion: { isReducedMotion: Schema.Boolean },
})
type Message = typeof Message.Type

// MODEL

const Model = Schema.Struct({
  isReducedMotion: Schema.Boolean,
})
type Model = typeof Model.Type

// SUBSCRIPTION

const MotionPreferences = Block.define('MotionPreferences', { Model, Message })

const subscriptions = MotionPreferences.subscriptions(entry => ({
  reducedMotionChanges: entry('ReducedMotionChanges', {
    messages: [Message.ChangedReducedMotion],
    handler: function* () {
      return () =>
        Dom.streamFromMediaQuery({
          query: '(prefers-reduced-motion: reduce)',
          mapMatches: isMatching =>
            Message.ChangedReducedMotion({ isReducedMotion: isMatching }),
        })
    },
  }),
}))
