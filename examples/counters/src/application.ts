import { Array, Number, Schema } from 'effect'
import { defineApplication } from 'foldkit'
import type { Block } from 'foldkit'
import { Html } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Button } from '@foldkit/ui'

import * as Counter from './counter'

const INITIAL_COUNTER_COUNT = 3

const CounterInstance = Schema.Struct({
  id: Schema.String,
  counter: Counter.Model,
})
type CounterInstance = typeof CounterInstance.Type

export const Model = Schema.Struct({
  counters: Schema.Array(CounterInstance),
  nextCounterId: Schema.Number,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ClickedAddCounter: {},
  ClickedRemoveCounter: { id: Schema.String },
  GotCounterMessage: {
    id: Schema.String,
    message: Counter.Message,
  },
})

export type Message = typeof Message.Type

export const Application = defineApplication({ Model, Message })

const counters = Application.bindChild(Counter.block, {
  field: 'counters',
  key: 'id',
  childField: 'counter',
  toParentMessage: (id, message) => Message.GotCounterMessage({ id, message }),
})

export const ApplicationComposition = Application.toComposition({
  children: [counters],
})

export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    ClickedAddCounter: () => {
      const id = `counter-${model.nextCounterId}`
      const counterInit = counters.init(id)

      return {
        model: modifyFields(model, {
          counters: Array.append({ id, counter: counterInit.model }),
          nextCounterId: Number.increment,
        }),
        commands: counterInit.commands,
      }
    },
    ClickedRemoveCounter: ({ id }) => ({
      model: modifyFields(model, {
        counters: Array.filter(counterInstance => counterInstance.id !== id),
      }),
    }),
    GotCounterMessage: ({ id, message }) => counters.fold(model, id, message),
  }),
)

export const init = () => {
  const counterInits = Array.makeBy(INITIAL_COUNTER_COUNT, counterId => {
    const id = `counter-${counterId}`
    const counterInit = counters.init(id)

    return { id, counterInit }
  })

  return {
    model: {
      counters: Array.map(counterInits, ({ id, counterInit }) => ({
        id,
        counter: counterInit.model,
      })),
      nextCounterId: INITIAL_COUNTER_COUNT,
    },
    commands: Array.flatMap(
      counterInits,
      ({ counterInit }) => counterInit.commands ?? [],
    ),
  }
}

type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>

const counterInstanceView = (
  counterInstance: CounterInstance,
  h: ViewBuilder,
): Html =>
  h.keyed('div')(
    counterInstance.id,
    [h.Class('flex items-center gap-2')],
    [
      h.div(
        [h.Class('flex-1')],
        [
          h.block(
            counters.embedView({
              key: counterInstance.id,
              slotId: counterInstance.id,
              model: counterInstance.counter,
            }),
          ),
        ],
      ),
      Button.view(
        {
          onClick: Message.ClickedRemoveCounter({ id: counterInstance.id }),
          toView: attributes =>
            h.button(
              [
                ...attributes.button,
                h.Class(
                  'rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:border-red-300 hover:text-red-600 transition cursor-pointer',
                ),
              ],
              ['Remove'],
            ),
        },
        h,
      ),
    ],
  )

export const view = ApplicationComposition.view((model, h) => ({
  title: `Counters (${model.counters.length})`,
  body: h.div(
    [
      h.Class(
        'min-h-screen bg-white flex flex-col items-center py-12 px-6 gap-6',
      ),
    ],
    [
      h.h1([h.Class('text-2xl font-semibold text-gray-900')], ['Counters']),
      h.p(
        [h.Class('text-sm text-gray-500 max-w-md text-center')],
        [
          'Each instance is a Counter Block. The parent has no awareness of Counter internals; it just embeds the Block via h.block and routes dispatched messages back to the corresponding instance via the GotCounterMessage wrapper.',
        ],
      ),
      h.div(
        [h.Class('flex flex-col gap-3 w-full max-w-md')],
        model.counters.map(counterInstance =>
          counterInstanceView(counterInstance, h),
        ),
      ),
      Button.view(
        {
          onClick: Message.ClickedAddCounter(),
          toView: attributes =>
            h.button(
              [
                ...attributes.button,
                h.Class(
                  'rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition cursor-pointer',
                ),
              ],
              ['+ Add Counter'],
            ),
        },
        h,
      ),
    ],
  ),
}))
