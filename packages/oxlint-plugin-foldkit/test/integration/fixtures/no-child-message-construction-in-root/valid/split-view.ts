import { CommandPalette } from '@foldkit/ui'

import { child, Message } from './split-child'
import { picker } from './picker'

const ChildComposition = child.toComposition()

export const splitView = ChildComposition.view((_model, h) =>
  h.button([h.OnClick(Message.ClickedSave())]),
)

export const splitViewWithInputs = ChildComposition.view.withInputs<unknown>(
  (_model, _viewInputs, h) =>
    h.button([h.OnClick(Message.ClickedSaveWithInputs())]),
)

export const completedNamespaceView = CommandPalette.view((_model, h) =>
  h.button([h.OnClick(CommandPalette.Message.ClickedSave())]),
)

export const genericFactoryView = picker.view((_model, h) =>
  h.button([h.OnClick(picker.Message.SelectedValue())]),
)
