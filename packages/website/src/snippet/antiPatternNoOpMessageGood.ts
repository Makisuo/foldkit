// ✅ Good: IgnoredMouseClick records the event even when the Model stays unchanged.

import { defineMessageUnion } from 'foldkit/message'

const Message = defineMessageUnion({
  IgnoredMouseClick: {},
})
type Message = typeof Message.Type

const handleMouseClick = () => Message.IgnoredMouseClick()

const update = Application.update((model, message) =>
  Message.match(message, {
    IgnoredMouseClick: () => ({ model }),
  }),
)
