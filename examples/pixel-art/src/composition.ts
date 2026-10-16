import { Array, Option } from 'effect'
import { type Block, Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Dialog } from '@foldkit/ui'

import { saveCanvas } from './command'
import {
  GridSizeRadioGroup,
  GRID_SIZE_RADIO_GROUP_ID,
  PALETTE_RADIO_GROUP_ID,
  PaletteRadioGroup,
  ThemeListbox,
  TOOL_RADIO_GROUP_ID,
  ToolRadioGroup,
} from './components'
import { DEFAULT_COLOR_INDEX } from './constant'
import { Application } from './definition'
import { createEmptyGrid, isGridEmpty } from './grid'
import { Message } from './message'
import {
  Model,
  type PaletteIndex,
  type Tool,
  paletteIndexFromValue,
} from './model'
import { PALETTE_THEMES } from './palette'

const foldErrorDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({
    model: modifyFields(model, { maybeExportError: () => Option.none() }),
  }),
})

export const ErrorDialogBinding = Application.bindChild(Dialog.block, {
  field: 'errorDialog',
  parentMessage: Message.GotErrorDialogMessage,
  init: { args: () => [{ id: 'export-error-dialog' }] },
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

export const GridSizeConfirmDialogBinding = Application.bindChild(
  Dialog.block,
  {
    field: 'gridSizeConfirmDialog',
    parentMessage: Message.GotGridSizeConfirmDialogMessage,
    init: { args: () => [{ id: 'grid-size-confirm-dialog' }] },
    outMessage: { fold: foldGridSizeConfirmDialogOutMessage },
  },
)

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

export const ToolRadioGroupBinding = Application.bindChild(ToolRadioGroup, {
  field: 'toolRadioGroup',
  parentMessage: Message.GotToolRadioGroupMessage,
  init: { args: () => [{ id: TOOL_RADIO_GROUP_ID }] },
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
    GridSizeConfirmDialogBinding.open(),
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

export const GridSizeRadioGroupBinding = Application.bindChild(
  GridSizeRadioGroup,
  {
    field: 'gridSizeRadioGroup',
    parentMessage: Message.GotGridSizeRadioGroupMessage,
    init: { args: () => [{ id: GRID_SIZE_RADIO_GROUP_ID }] },
    outMessage: { fold: foldGridSizeRadioGroupOutMessage },
  },
)

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

export const PaletteRadioGroupBinding = Application.bindChild(
  PaletteRadioGroup,
  {
    field: 'paletteRadioGroup',
    parentMessage: Message.GotPaletteRadioGroupMessage,
    init: { args: () => [{ id: PALETTE_RADIO_GROUP_ID }] },
    outMessage: { fold: foldPaletteRadioGroupOutMessage },
  },
)

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

export const ThemeListboxBinding = Application.bindChild(ThemeListbox, {
  field: 'themeListbox',
  parentMessage: Message.GotThemeListboxMessage,
  init: { args: () => [{ id: 'theme-picker' }] },
  outMessage: { fold: foldThemeListboxOutMessage },
})

export const ApplicationComposition = Application.toComposition({
  childBindings: [
    ErrorDialogBinding,
    ThemeListboxBinding,
    GridSizeConfirmDialogBinding,
    ToolRadioGroupBinding,
    GridSizeRadioGroupBinding,
    PaletteRadioGroupBinding,
  ],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
