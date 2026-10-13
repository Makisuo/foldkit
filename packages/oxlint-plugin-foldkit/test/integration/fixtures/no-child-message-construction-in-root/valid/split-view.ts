import { CommandPalette } from '@foldkit/ui'

import { child, Message } from './split-child'
import { picker } from './picker'

export const splitView = child.view((_model, h) =>
  h.button([h.OnClick(Message.ClickedSave())]),
)

export const splitViewWithInputs = child.view.withInputs<unknown>(
  (_model, _viewInputs, h) =>
    h.button([h.OnClick(Message.ClickedSaveWithInputs())]),
)

export const completedNamespaceView = CommandPalette.view((_model, h) =>
  h.button([h.OnClick(CommandPalette.Message.ClickedSave())]),
)

export const genericFactoryView = picker.view((_model, h) =>
  h.button([h.OnClick(picker.Message.SelectedValue())]),
)
