import { Block } from 'foldkit'

import { Child } from './child'
import {
  ApplicationComposition,
  type ViewBuilder as ImportedViewBuilder,
} from './rootApplication'

type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>

export const localAliasButton = (h: ViewBuilder) =>
  h.button([h.OnClick(Child.Message.ClickedFromLocalViewBuilder())])

export const importedAliasButton = (h: ImportedViewBuilder) =>
  h.button([h.OnClick(Child.Message.ClickedFromImportedViewBuilder())])
