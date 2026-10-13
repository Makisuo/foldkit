import { Array, Match, Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Dialog } from '@foldkit/ui'

import { ExportPng, saveCanvas } from './command'
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
import { Application as Authoring } from './definition'
import {
  createEmptyGrid,
  erasePixels,
  floodFill,
  getMirroredPositions,
  isGridEmpty,
  pushHistory,
  setPixels,
} from './grid'
import { Message } from './message'
import {
  Model,
  type PaletteIndex,
  type Tool,
  paletteIndexFromValue,
} from './model'
import { PALETTE_THEMES } from './palette'

const applyEraser = (model: Model, x: number, y: number) => {
  const positions = getMirroredPositions(x, y, model.gridSize, model.mirrorMode)
  return erasePixels(model.grid, positions)
}

const applyBrush = (model: Model, x: number, y: number) => {
  const positions = getMirroredPositions(x, y, model.gridSize, model.mirrorMode)
  return setPixels(model.grid, positions, model.selectedColorIndex)
}

const applyFill = (model: Model, x: number, y: number) => {
  const positions = getMirroredPositions(x, y, model.gridSize, 'None')
  return Array.reduce(positions, model.grid, (currentGrid, [fillX, fillY]) =>
    floodFill(currentGrid, fillX, fillY, model.selectedColorIndex),
  )
}

const foldErrorDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({
    model: modifyFields(model, { maybeExportError: () => Option.none() }),
  }),
})

export const errorDialog = Dialog.block.connection({
  Model: Model,
  field: 'errorDialog',
  parentMessage: Message.GotErrorDialogMessage,
  outMessage: { fold: foldErrorDialogOutMessage },
})

const foldThemeListboxOutMessage = ThemeListbox.OutMessage.match({
  Selected: ({ value }) =>
    Authoring.step(model => {
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

export const themeListbox = ThemeListbox.connection({
  Model: Model,
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

export const gridSizeConfirmDialog = Dialog.block.connection({
  Model: Model,
  field: 'gridSizeConfirmDialog',
  parentMessage: Message.GotGridSizeConfirmDialogMessage,
  outMessage: { fold: foldGridSizeConfirmDialogOutMessage },
})

const selectTool = (model: Model, tool: Tool) => ({
  model: modifyFields(model, { tool: () => tool }),
})

const selectColor = (model: Model, colorIndex: PaletteIndex) => {
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

export const toolRadioGroup = ToolRadioGroup.connection({
  placement: TOOL_RADIO_GROUP_ID,
  Model: Model,
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

export const gridSizeRadioGroup = GridSizeRadioGroup.connection({
  placement: GRID_SIZE_RADIO_GROUP_ID,
  Model: Model,
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

export const paletteRadioGroup = PaletteRadioGroup.connection({
  placement: PALETTE_RADIO_GROUP_ID,
  Model: Model,
  field: 'paletteRadioGroup',
  parentMessage: Message.GotPaletteRadioGroupMessage,
  outMessage: { fold: foldPaletteRadioGroupOutMessage },
})

export const Application = Authoring.register({
  children: [
    errorDialog,
    themeListbox,
    gridSizeConfirmDialog,
    toolRadioGroup,
    gridSizeRadioGroup,
    paletteRadioGroup,
  ],
})

export const update = Application.update((model, message) =>
  Message.match(message, {
    PressedCell: ({ x, y }) =>
      Match.value(model.tool).pipe(
        Match.when('Brush', () => ({
          model: modifyFields(model, {
            grid: () => applyBrush(model, x, y),
            undoStack: () => pushHistory(model.undoStack, model.grid),
            redoStack: () => [],
            isDrawing: () => true,
          }),
        })),
        Match.when('Fill', () => {
          const nextModel = modifyFields(model, {
            grid: () => applyFill(model, x, y),
            undoStack: () => pushHistory(model.undoStack, model.grid),
            redoStack: () => [],
          })
          return { model: nextModel, commands: [saveCanvas(nextModel)] }
        }),
        Match.when('Eraser', () => ({
          model: modifyFields(model, {
            grid: () => applyEraser(model, x, y),
            undoStack: () => pushHistory(model.undoStack, model.grid),
            redoStack: () => [],
            isDrawing: () => true,
          }),
        })),
        Match.exhaustive,
      ),

    EnteredCell: ({ x, y }) => {
      const withHover = modifyFields(model, {
        maybeHoveredCell: () => Option.some({ x, y }),
      })

      if (model.isDrawing && model.tool === 'Brush') {
        return {
          model: modifyFields(withHover, {
            grid: () => applyBrush(model, x, y),
          }),
        }
      }

      if (model.isDrawing && model.tool === 'Eraser') {
        return {
          model: modifyFields(withHover, {
            grid: () => applyEraser(model, x, y),
          }),
        }
      }

      return { model: withHover }
    },

    LeftCanvas: () => ({
      model: modifyFields(model, { maybeHoveredCell: () => Option.none() }),
    }),

    ReleasedMouse: () => {
      if (!model.isDrawing) {
        return { model }
      }
      const nextModel = modifyFields(model, { isDrawing: () => false })
      return { model: nextModel, commands: [saveCanvas(nextModel)] }
    },

    SelectedColor: ({ colorIndex }) => selectColor(model, colorIndex),

    SelectedTool: ({ tool }) => selectTool(model, tool),

    SelectedGridSize: ({ size }) => requestGridSizeChange(model, size),

    GotToolRadioGroupMessage: ({ message }) =>
      toolRadioGroup.fold(model, message),

    GotGridSizeRadioGroupMessage: ({ message }) =>
      gridSizeRadioGroup.fold(model, message),

    GotPaletteRadioGroupMessage: ({ message }) =>
      paletteRadioGroup.fold(model, message),

    ToggledMirrorHorizontal: () => {
      const nextMirrorMode = Match.value(model.mirrorMode).pipe(
        Match.when('None', () => 'Horizontal' as const),
        Match.when('Horizontal', () => 'None' as const),
        Match.when('Vertical', () => 'Both' as const),
        Match.when('Both', () => 'Vertical' as const),
        Match.exhaustive,
      )
      return {
        model: modifyFields(model, { mirrorMode: () => nextMirrorMode }),
      }
    },

    ToggledMirrorVertical: () => {
      const nextMirrorMode = Match.value(model.mirrorMode).pipe(
        Match.when('None', () => 'Vertical' as const),
        Match.when('Vertical', () => 'None' as const),
        Match.when('Horizontal', () => 'Both' as const),
        Match.when('Both', () => 'Horizontal' as const),
        Match.exhaustive,
      )
      return {
        model: modifyFields(model, { mirrorMode: () => nextMirrorMode }),
      }
    },

    ClickedUndo: () =>
      Array.match(model.undoStack, {
        onEmpty: () => ({ model }),
        onNonEmpty: nonEmptyUndoStack => {
          const nextModel = modifyFields(model, {
            grid: () => Array.lastNonEmpty(nonEmptyUndoStack),
            undoStack: () => Array.initNonEmpty(nonEmptyUndoStack),
            redoStack: () => [...model.redoStack, model.grid],
          })
          return { model: nextModel, commands: [saveCanvas(nextModel)] }
        },
      }),

    ClickedRedo: () =>
      Array.match(model.redoStack, {
        onEmpty: () => ({ model }),
        onNonEmpty: nonEmptyRedoStack => {
          const nextModel = modifyFields(model, {
            grid: () => Array.lastNonEmpty(nonEmptyRedoStack),
            undoStack: () => [...model.undoStack, model.grid],
            redoStack: () => Array.initNonEmpty(nonEmptyRedoStack),
          })
          return { model: nextModel, commands: [saveCanvas(nextModel)] }
        },
      }),

    ClickedHistoryStep: ({ stepIndex }) => {
      const targetGrid = model.undoStack[stepIndex]
      if (targetGrid === undefined) {
        return { model }
      }

      const statesAfterTarget = Array.drop(model.undoStack, stepIndex + 1)

      const nextModel = modifyFields(model, {
        grid: () => targetGrid,
        undoStack: () => Array.take(model.undoStack, stepIndex),
        redoStack: () => [
          ...model.redoStack,
          model.grid,
          ...Array.reverse(statesAfterTarget),
        ],
      })

      return { model: nextModel, commands: [saveCanvas(nextModel)] }
    },

    ClickedRedoStep: ({ stepIndex }) => {
      const targetGrid = model.redoStack[stepIndex]
      if (targetGrid === undefined) {
        return { model }
      }

      const statesBetweenCurrentAndTarget = Array.drop(
        model.redoStack,
        stepIndex + 1,
      )

      const nextModel = modifyFields(model, {
        grid: () => targetGrid,
        undoStack: () => [
          ...model.undoStack,
          model.grid,
          ...Array.reverse(statesBetweenCurrentAndTarget),
        ],
        redoStack: () => Array.take(model.redoStack, stepIndex),
      })

      return { model: nextModel, commands: [saveCanvas(nextModel)] }
    },

    ClickedClear: () => {
      const nextModel = modifyFields(model, {
        grid: () => createEmptyGrid(model.gridSize),
        undoStack: () => pushHistory(model.undoStack, model.grid),
        redoStack: () => [],
      })
      return { model: nextModel, commands: [saveCanvas(nextModel)] }
    },

    ClickedExport: () => ({
      model,
      commands: [
        ExportPng({
          grid: model.grid,
          gridSize: model.gridSize,
          paletteThemeIndex: model.paletteThemeIndex,
        }),
      ],
    }),

    SucceededExportPng: () => ({ model }),

    CompletedSaveCanvas: () => ({ model }),

    FailedExportPng: ({ error }) =>
      Update.combine(model, [
        stepModel => ({
          model: modifyFields(stepModel, {
            maybeExportError: () => Option.some(error),
          }),
        }),
        errorDialog.open(),
      ]),

    GotErrorDialogMessage: ({ message }) => errorDialog.fold(model, message),

    GotThemeListboxMessage: ({ message }) => themeListbox.fold(model, message),

    ConfirmedGridSizeChange: () =>
      Option.match(model.maybePendingGridSize, {
        onNone: () => ({ model }),
        onSome: pendingSize =>
          Update.combine(model, [
            stepModel => applyGridSizeChange(stepModel, pendingSize),
            gridSizeConfirmDialog.close(),
            stepModel => ({
              model: stepModel,
              commands: [saveCanvas(stepModel)],
            }),
          ]),
      }),

    GotGridSizeConfirmDialogMessage: ({ message }) =>
      gridSizeConfirmDialog.fold(model, message),
  }),
)

const applyGridSizeChange = (model: Model, size: number) => ({
  model: modifyFields(model, {
    grid: () => createEmptyGrid(size),
    gridSize: () => size,
    undoStack: () => [],
    redoStack: () => [],
    isDrawing: () => false,
    maybeHoveredCell: () => Option.none(),
  }),
})

const requestGridSizeChange = (model: Model, size: number) => {
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
