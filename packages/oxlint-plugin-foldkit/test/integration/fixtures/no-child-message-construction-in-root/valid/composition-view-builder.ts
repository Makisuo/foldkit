import { Block } from 'foldkit'

import {
  ApplicationComposition,
  Message,
  type ViewBuilder as ImportedViewBuilder,
} from './rootApplication'

type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>

export const localAliasButton = (h: ViewBuilder) =>
  h.button([h.OnClick(Message.ClickedFromLocalViewBuilder())])

export const importedAliasButton = (h: ImportedViewBuilder) =>
  h.button([h.OnClick(Message.ClickedFromImportedViewBuilder())])
