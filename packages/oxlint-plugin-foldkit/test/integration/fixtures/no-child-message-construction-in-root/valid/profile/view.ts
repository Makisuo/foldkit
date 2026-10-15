import { Block } from 'foldkit'

import { Message as ProfileMessage } from './definition'
import {
  ProfileComposition,
  type ViewBuilder as ImportedViewBuilder,
} from './profile'

const Message = ProfileMessage

type ViewBuilder = Block.HtmlBuilderOf<typeof ProfileComposition>

const saveButton = (h: ViewBuilder) =>
  h.button([h.OnClick(Message.ClickedSave())])

const importedBuilderSaveButton = (h: ImportedViewBuilder) =>
  h.button([h.OnClick(Message.ClickedSaveFromImportedBuilder())])

export const view = ProfileComposition.view((_model, h) =>
  h.div([], [saveButton(h), importedBuilderSaveButton(h)]),
)
