import { Effect } from 'effect'
import { Block, Command } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Model } from './application'

const ApplicationDefinition = defineApplication({ Model, Message })

export const Message = defineMessageUnion({
  ClickedResetAfterDelay: {},
  ClickedCancelReset: {},
  CompletedWaitBeforeReset: {},
  CompletedCancelWaitBeforeReset: {
    outcome: Command.Interruptible.Outcome,
  },
})
export type Message = typeof Message.Type

export const WaitBeforeReset = ApplicationDefinition.command(
  'WaitBeforeReset',
  {
    messages: [Message.CompletedWaitBeforeReset],
    interrupt: true,
    handler: function* () {
      return () =>
        Effect.sleep('1 second').pipe(
          Effect.as(Message.CompletedWaitBeforeReset()),
        )
    },
  },
)

export const EffectsLayer = WaitBeforeReset.layer

const update = ApplicationDefinition.update((model, message) =>
  Message.match(message, {
    ClickedResetAfterDelay: () => ({
      model,
      commands: [WaitBeforeReset()],
    }),
    ClickedCancelReset: () => ({
      model,
      commands: [
        WaitBeforeReset.Interrupt(outcome =>
          Message.CompletedCancelWaitBeforeReset({ outcome }),
        ),
      ],
    }),
    CompletedWaitBeforeReset: () => ({
      model: modifyFields(model, { count: () => 0 }),
    }),
    CompletedCancelWaitBeforeReset: () => ({ model }),
  }),
)
