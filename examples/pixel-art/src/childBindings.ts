import { Array, Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Dialog } from '@foldkit/ui'

import { saveCanvas } from './command'
import {
  GRID_SIZE_RADIO_GROUP_ID,
  GridSizeRadioGroup,
  PALETTE_RADIO_GROUP_ID,
  PaletteRadioGroup,
  TOOL_RADIO_GROUP_ID,
  ThemeListbox,
  ToolRadioGroup,
} from './components'
import { DEFAULT_COLOR_INDEX } from './constant'
import { ApplicationDefinition } from './definition'
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

export const errorDialog = ApplicationDefinition.bindChild(Dialog.block, {
  field: 'errorDialog',
  parentMessage: Message.GotErrorDialogMessage,
  outMessage: { fold: foldErrorDialogOutMessage },
})

const foldThemeListboxOutMessage = ThemeListbox.OutMessage.match({
  Selected: ({ value }) =>
    ApplicationDefinition.step(model => {
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

export const themeListbox = ApplicationDefinition.bindChild(ThemeListbox, {
  field: 'themeListbox',
  parentMessage: Message.GotThemeListboxMessage,
  outMessage: { fold: foldThemeListboxOutMessage },
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

export const gridSizeConfirmDialog = ApplicationDefinition.bindChild(
  Dialog.block,
  {
    field: 'gridSizeConfirmDialog',
    parentMessage: Message.GotGridSizeConfirmDialogMessage,
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

export const toolRadioGroup = ApplicationDefinition.bindChild(ToolRadioGroup, {
  placement: TOOL_RADIO_GROUP_ID,
  field: 'toolRadioGroup',
  parentMessage: Message.GotToolRadioGroupMessage,
  outMessage: { fold: foldToolRadioGroupOutMessage },
})

const foldGridSizeRadioGroupOutMessage = GridSizeRadioGroup.OutMessage.match<
  (model: Model) => ReturnType<typeof requestGridSizeChange>
>({
  Selected:
    ({ value }) =>
    model =>
      requestGridSizeChange(model, Number(value)),
})

export const gridSizeRadioGroup = ApplicationDefinition.bindChild(
  GridSizeRadioGroup,
  {
    placement: GRID_SIZE_RADIO_GROUP_ID,
    field: 'gridSizeRadioGroup',
    parentMessage: Message.GotGridSizeRadioGroupMessage,
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

export const paletteRadioGroup = ApplicationDefinition.bindChild(
  PaletteRadioGroup,
  {
    placement: PALETTE_RADIO_GROUP_ID,
    field: 'paletteRadioGroup',
    parentMessage: Message.GotPaletteRadioGroupMessage,
    outMessage: { fold: foldPaletteRadioGroupOutMessage },
  },
)

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
