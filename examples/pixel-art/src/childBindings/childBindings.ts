import { Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Dialog } from '@foldkit/ui'

import { saveCanvas } from '../command'
import {
  GRID_SIZE_RADIO_GROUP_ID,
  GridSizeRadioGroup,
  PALETTE_RADIO_GROUP_ID,
  PaletteRadioGroup,
  TOOL_RADIO_GROUP_ID,
  ToolRadioGroup,
} from '../components'
import { Application } from '../definition'
import { createEmptyGrid, isGridEmpty } from '../grid'
import { Message } from '../message'
import {
  Model,
  type PaletteIndex,
  type Tool,
  paletteIndexFromValue,
} from '../model'
import { themeListbox } from './themeListbox'

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

export const children = [
  errorDialog,
  themeListbox,
  gridSizeConfirmDialog,
  toolRadioGroup,
  gridSizeRadioGroup,
  paletteRadioGroup,
] as const
