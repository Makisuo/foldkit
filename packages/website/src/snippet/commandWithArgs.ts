import { Duration, Effect, Schema } from 'effect'
import { defineApplication } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Model } from './application'

const Application = defineApplication({ Model, Message })

const Message = defineMessageUnion({
  ClickedResetAfterDelay: { delayMs: Schema.Number },
  CompletedWaitBeforeReset: {},
})
type Message = typeof Message.Type

const WaitBeforeReset = Application.command('WaitBeforeReset', {
  args: { delayMs: Schema.Number },
  messages: [Message.CompletedWaitBeforeReset],
  handler: function* () {
    return ({ delayMs }) =>
      Effect.sleep(Duration.millis(delayMs)).pipe(
        Effect.as(Message.CompletedWaitBeforeReset()),
      )
  },
})

const update = Application.update((model, message) =>
  Message.match(message, {
    ClickedResetAfterDelay: ({ delayMs }) => ({
      model,
      commands: [WaitBeforeReset({ delayMs })],
    }),
    CompletedWaitBeforeReset: () => ({
      model: modifyFields(model, { count: () => 0 }),
    }),
  }),
)
