import { Effect, Schema, Stream } from 'effect'
import { Subscription } from 'foldkit'

import { capturedKeyDownStream } from '../../keyboard'
import { Message } from './message'
import { Model, capturesKeyboard } from './model'
import { owner } from './owner'

export const subscriptions = Subscription.make<Model, Message>()(entry => ({
  homeKeyPresses: entry(
    owner.name('HomeKeyPresses'),
    { shouldCaptureKeyboard: Schema.Boolean },
    {
      messages: [Message.PressedKey],
      modelToDependencies: model => ({
        shouldCaptureKeyboard: capturesKeyboard(model),
      }),
      handler: function* () {
        return ({ shouldCaptureKeyboard }) =>
          Stream.when(
            capturedKeyDownStream(key => Message.PressedKey({ key })),
            Effect.sync(() => shouldCaptureKeyboard),
          )
      },
    },
  ),
}))
