import { Array, Effect, Layer, Option, Schema } from 'effect'
import { KeyValueStore } from 'effect/persistence'
import { type Block, Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Dialog, Listbox, RadioGroup } from '@foldkit/ui'

import { ExportPng, SaveCanvas, saveCanvas } from './command'
import {
  GRID_SIZE_RADIO_GROUP_ID,
  GridSizeRadioGroup,
  PALETTE_RADIO_GROUP_ID,
  PaletteRadioGroup,
  TOOL_RADIO_GROUP_ID,
  ThemeListbox,
  ToolRadioGroup,
} from './components'
import {
  DEFAULT_COLOR_INDEX,
  DEFAULT_GRID_SIZE,
  DEFAULT_PALETTE_THEME_INDEX,
  STORAGE_KEY,
} from './constant'
import { Application } from './definition'
import { createEmptyGrid, isGridEmpty } from './grid'
import { Message } from './message'
import {
  Model,
  type PaletteIndex,
  SavedCanvas,
  SavedCanvasJsonString,
  type Tool,
  paletteIndexFromValue,
} from './model'
import { PALETTE_THEMES } from './palette'
import { subscriptions } from './subscription'

const foldErrorDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({
    model: modifyFields(model, { maybeExportError: () => Option.none() }),
  }),
})

export const errorDialog = Application.bindChild(Dialog.block, {
  field: 'errorDialog',
  parentMessage: Message.GotErrorDialogMessage,
  outMessage: { fold: foldErrorDialogOutMessage },
})

const foldGridSizeConfirmDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({
    model: modifyFields(model, {
      maybePendingGridSize: () => Option.none(),
    }),
  }),
})

export const gridSizeConfirmDialog = Application.bindChild(Dialog.block, {
  field: 'gridSizeConfirmDialog',
  parentMessage: Message.GotGridSizeConfirmDialogMessage,
  outMessage: { fold: foldGridSizeConfirmDialogOutMessage },
})

export const selectTool = (model: Model, tool: Tool) => ({
  model: modifyFields(model, { tool: () => tool }),
})

export const selectColor = (model: Model, colorIndex: PaletteIndex) => {
  const nextModel = modifyFields(model, {
    selectedColorIndex: () => colorIndex,
  })
  return { model: nextModel, commands: [saveCanvas(nextModel)] }
}

const foldToolRadioGroupOutMessage = ToolRadioGroup.OutMessage.match<
  (model: Model) => ReturnType<typeof selectTool>,
  typeof ToolRadioGroup.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model =>
      selectTool(model, value),
})

export const toolRadioGroup = Application.bindChild(ToolRadioGroup, {
  placement: TOOL_RADIO_GROUP_ID,
  field: 'toolRadioGroup',
  parentMessage: Message.GotToolRadioGroupMessage,
  outMessage: { fold: foldToolRadioGroupOutMessage },
})

export const applyGridSizeChange = (model: Model, size: number) => ({
  model: modifyFields(model, {
    grid: () => createEmptyGrid(size),
    gridSize: () => size,
    undoStack: () => [],
    redoStack: () => [],
    isDrawing: () => false,
    maybeHoveredCell: () => Option.none(),
  }),
})

export const requestGridSizeChange = (model: Model, size: number) => {
  if (size === model.gridSize) {
    return { model }
  }

  if (isGridEmpty(model.grid)) {
    return applyGridSizeChange(model, size)
  }

  return Update.combine(model, [
    stepModel => ({
      model: modifyFields(stepModel, {
        maybePendingGridSize: () => Option.some(size),
      }),
    }),
    gridSizeConfirmDialog.open(),
  ])
}

const foldGridSizeRadioGroupOutMessage = GridSizeRadioGroup.OutMessage.match<
  (model: Model) => ReturnType<typeof requestGridSizeChange>
>({
  Selected:
    ({ value }) =>
    model =>
      requestGridSizeChange(model, Number(value)),
})

export const gridSizeRadioGroup = Application.bindChild(GridSizeRadioGroup, {
  placement: GRID_SIZE_RADIO_GROUP_ID,
  field: 'gridSizeRadioGroup',
  parentMessage: Message.GotGridSizeRadioGroupMessage,
  outMessage: { fold: foldGridSizeRadioGroupOutMessage },
})

const foldPaletteRadioGroupOutMessage = PaletteRadioGroup.OutMessage.match<
  (model: Model) => ReturnType<typeof selectColor>
>({
  Selected:
    ({ value }) =>
    model =>
      selectColor(
        model,
        paletteIndexFromValue(value, model.selectedColorIndex),
      ),
})

export const paletteRadioGroup = Application.bindChild(PaletteRadioGroup, {
  placement: PALETTE_RADIO_GROUP_ID,
  field: 'paletteRadioGroup',
  parentMessage: Message.GotPaletteRadioGroupMessage,
  outMessage: { fold: foldPaletteRadioGroupOutMessage },
})

const foldThemeListboxOutMessage = ThemeListbox.OutMessage.match({
  Selected: ({ value }) =>
    Application.step(model => {
      const themeIndex = Number(value)
      const maybeNextTheme = Array.get(PALETTE_THEMES, themeIndex)
      if (Option.isNone(maybeNextTheme)) {
        return { model }
      }
      const nextModel = modifyFields(model, {
        paletteThemeIndex: () => themeIndex,
        selectedColorIndex: () => DEFAULT_COLOR_INDEX,
      })
      return { model: nextModel, commands: [saveCanvas(nextModel)] }
    }),
})

export const themeListbox = Application.bindChild(ThemeListbox, {
  field: 'themeListbox',
  parentMessage: Message.GotThemeListboxMessage,
  outMessage: { fold: foldThemeListboxOutMessage },
})

export const EffectsLayer = Layer.mergeAll(
  SaveCanvas.layer,
  ExportPng.layer,
  subscriptions.undoRedoKeyPresses.layer,
  subscriptions.toolKeyPresses.layer,
  subscriptions.mouseReleases.layer,
)

export const Flags = Schema.Struct({
  maybeSavedCanvas: Schema.Option(SavedCanvas),
})
export type Flags = typeof Flags.Type

export const flags = Effect.gen(function* () {
  const store = yield* KeyValueStore.KeyValueStore
  const json = yield* Effect.fromOption(
    Option.fromNullishOr(yield* store.get(STORAGE_KEY)),
  )
  const decoded = yield* Schema.decodeEffect(SavedCanvasJsonString)(json)

  return Flags.make({ maybeSavedCanvas: Option.some(decoded) })
}).pipe(
  Effect.catch(() =>
    Effect.succeed(Flags.make({ maybeSavedCanvas: Option.none() })),
  ),
)

export const init = Application.init((flags: Flags) => ({
  model: Model.make({
    grid: Option.match(flags.maybeSavedCanvas, {
      onNone: () => createEmptyGrid(DEFAULT_GRID_SIZE),
      onSome: ({ grid }) => grid,
    }),
    undoStack: [],
    redoStack: [],
    selectedColorIndex: Option.match(flags.maybeSavedCanvas, {
      onNone: () => DEFAULT_COLOR_INDEX,
      onSome: ({ selectedColorIndex }) => selectedColorIndex,
    }),
    gridSize: Option.match(flags.maybeSavedCanvas, {
      onNone: () => DEFAULT_GRID_SIZE,
      onSome: ({ gridSize }) => gridSize,
    }),
    tool: 'Brush',
    mirrorMode: 'None',
    isDrawing: false,
    maybeHoveredCell: Option.none(),
    errorDialog: Dialog.init({ id: 'export-error-dialog' }),
    maybeExportError: Option.none(),
    paletteThemeIndex: Option.match(flags.maybeSavedCanvas, {
      onNone: () => DEFAULT_PALETTE_THEME_INDEX,
      onSome: ({ paletteThemeIndex }) => paletteThemeIndex,
    }),
    gridSizeConfirmDialog: Dialog.init({ id: 'grid-size-confirm-dialog' }),
    maybePendingGridSize: Option.none(),
    themeListbox: Listbox.init({ id: 'theme-picker' }),
    toolRadioGroup: RadioGroup.init({ id: TOOL_RADIO_GROUP_ID }),
    gridSizeRadioGroup: RadioGroup.init({ id: GRID_SIZE_RADIO_GROUP_ID }),
    paletteRadioGroup: RadioGroup.init({ id: PALETTE_RADIO_GROUP_ID }),
  }),
}))

export const ApplicationComposition = Application.toComposition({
  children: [
    errorDialog,
    themeListbox,
    gridSizeConfirmDialog,
    toolRadioGroup,
    gridSizeRadioGroup,
    paletteRadioGroup,
  ],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
