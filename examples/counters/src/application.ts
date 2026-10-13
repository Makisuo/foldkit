import { Array, Schema } from 'effect'
import {
  define as defineApplication,
  type HtmlBuilderOf,
} from 'foldkit/application'
import { Html } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Button } from '@foldkit/ui'

import * as Counter from './counter'

// MODEL

const Row = Schema.Struct({
  id: Schema.String,
  counter: Counter.Model,
})
type Row = typeof Row.Type

export const Model = Schema.Struct({
  rows: Schema.Array(Row),
  nextRowId: Schema.Number,
})
export type Model = typeof Model.Type

// MESSAGE

export const Message = defineMessageUnion({
  ClickedAddRow: {},
  ClickedRemoveRow: { id: Schema.String },
  GotCounterMessage: {
    id: Schema.String,
    message: Counter.Message,
  },
})

export type Message = typeof Message.Type

// UPDATE

const counters = Counter.block.keyedConnection({
  readAll: (model: Model) => model.rows,
  key: row => row.id,
  read: row => row.counter,
  writeAt: (
    model: Model,
    id: string,
    nextCounter: typeof Counter.Model.Type,
  ): Model =>
    modifyFields(model, {
      rows: Array.map((row): Row =>
        row.id === id ? modifyFields(row, { counter: () => nextCounter }) : row,
      ),
    }),
  toParentMessage: (
    id: string,
    message: typeof Counter.Message.Type,
  ): Message => Message.GotCounterMessage({ id, message }),
})

export const Application = defineApplication({ Model, Message }).register({
  children: [counters],
})

export const update = Application.update((model, message) =>
  Message.match(message, {
    ClickedAddRow: () => ({
      model: modifyFields(model, {
        rows: Array.append({
          id: `counter-${model.nextRowId}`,
          counter: counters.init(`counter-${model.nextRowId}`).model,
        }),
        nextRowId: nextRowId => nextRowId + 1,
      }),
    }),
    ClickedRemoveRow: ({ id }) => ({
      model: modifyFields(model, {
        rows: Array.filter(row => row.id !== id),
      }),
    }),
    GotCounterMessage: ({ id, message }) => counters.fold(model, id, message),
  }),
)

// INIT

export const init = () => ({
  model: {
    rows: [
      { id: 'counter-0', counter: counters.init('counter-0').model },
      { id: 'counter-1', counter: counters.init('counter-1').model },
      { id: 'counter-2', counter: counters.init('counter-2').model },
    ],
    nextRowId: 3,
  },
})

// VIEW

type ViewBuilder = HtmlBuilderOf<typeof Application>

const rowView = (row: Row, h: ViewBuilder): Html =>
  h.keyed('div')(
    row.id,
    [h.Class('flex items-center gap-2')],
    [
      h.div(
        [h.Class('flex-1')],
        [
          h.block(
            counters.embedView({
              key: row.id,
              slotId: row.id,
              model: row.counter,
            }),
          ),
        ],
      ),
      Button.view(
        {
          onClick: Message.ClickedRemoveRow({ id: row.id }),
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

export const view = Application.view((model, h) => ({
  title: `Counters (${model.rows.length})`,
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
          'Each row is a Counter Block. The parent has no awareness of Counter internals; it just embeds the Block via h.block and routes dispatched messages back to the right row via the GotCounterMessage wrapper.',
        ],
      ),
      h.div(
        [h.Class('flex flex-col gap-3 w-full max-w-md')],
        model.rows.map(row => rowView(row, h)),
      ),
      Button.view(
        {
          onClick: Message.ClickedAddRow(),
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

export const implementation = {
  init,
  update,
  view,
}
