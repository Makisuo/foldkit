import { Effect, Number, Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

// MODEL

export const Model = Schema.Struct({ count: Schema.Int })
export type Model = typeof Model.Type

// MESSAGE

export const Message = defineMessageUnion({
  ClickedIncrement: {},
  ClickedResetAfterDelay: {},
  CompletedWaitBeforeReset: {},
})

export const Application = defineApplication({ Model, Message })
export type Message = typeof Message.Type

// COMMAND

export const WaitBeforeReset = Application.command('WaitBeforeReset', {
  messages: [Message.CompletedWaitBeforeReset],
  handler: function* () {
    return () =>
      Effect.sleep('1 second').pipe(
        Effect.as(Message.CompletedWaitBeforeReset()),
      )
  },
})

export const EffectsLayer = WaitBeforeReset.layer

// INIT

export const init = () => ({
  model: Model.make({ count: 0 }),
})

// UPDATE

export const update = Application.update((model, message) =>
  Message.match(message, {
    ClickedIncrement: () => ({
      model: modifyFields(model, { count: Number.increment }),
    }),
    ClickedResetAfterDelay: () => ({
      model,
      commands: [WaitBeforeReset()],
    }),
    CompletedWaitBeforeReset: () => ({
      model: modifyFields(model, { count: () => 0 }),
    }),
  }),
)

// VIEW

export const view = Application.view((model, h) => ({
  title: `Counter: ${model.count}`,
  body: h.main(
    [],
    [
      h.p([], [`Count: ${model.count}`]),
      h.button([h.OnClick(Message.ClickedIncrement())], ['Increment']),
      h.button(
        [h.OnClick(Message.ClickedResetAfterDelay())],
        ['Reset after one second'],
      ),
    ],
  ),
}))
