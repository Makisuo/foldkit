import { Effect, Layer, Option, Schema } from 'effect'
import { KeyValueStore } from 'effect/persistence'

import { init as initDragAndDrop } from '@foldkit/ui/dragAndDrop'

import { FocusAddCardInput, GenerateCardId, SaveBoard } from './command'
import { DEFAULT_COLUMNS, STORAGE_KEY } from './constant'
import { Application } from './definition'
import { SavedBoard, SavedBoardJsonString } from './model'

export const EffectsLayer = Layer.mergeAll(
  GenerateCardId.layer,
  SaveBoard.layer,
  FocusAddCardInput.layer,
)

export const Flags = Schema.Struct({
  maybeSavedBoard: Schema.Option(SavedBoard),
})
export type Flags = typeof Flags.Type

export const flags = Effect.gen(function* () {
  const store = yield* KeyValueStore.KeyValueStore
  const json = yield* Effect.fromOption(
    Option.fromNullishOr(yield* store.get(STORAGE_KEY)),
  )
  const decoded = yield* Schema.decodeEffect(SavedBoardJsonString)(json)

  return Flags.make({ maybeSavedBoard: Option.some(decoded) })
}).pipe(
  Effect.catch(() =>
    Effect.succeed(Flags.make({ maybeSavedBoard: Option.none() })),
  ),
)

export const init = Application.init((flags: Flags) => {
  const columns = Option.match(flags.maybeSavedBoard, {
    onNone: () => DEFAULT_COLUMNS,
    onSome: ({ columns }) => columns,
  })

  return {
    model: {
      columns,
      dragAndDrop: initDragAndDrop({ id: 'kanban' }),
      maybeNewCardColumnId: Option.none(),
      newCardTitle: '',
      announcement: '',
    },
  }
})
