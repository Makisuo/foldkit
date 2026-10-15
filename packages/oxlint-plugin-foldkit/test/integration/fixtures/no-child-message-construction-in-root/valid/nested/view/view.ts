import { Block } from 'foldkit'

import {
  NestedComposition as DirectNestedComposition,
  type ViewBuilder as DirectViewBuilder,
} from '../composition/composition.js'
import {
  NestedComposition,
  type ViewBuilder as BarrelViewBuilder,
} from '../composition/index.js'
import { Message } from '../definition.js'

type LocalViewBuilder = Block.HtmlBuilderOf<typeof NestedComposition>

const localButton = (h: LocalViewBuilder) =>
  h.button([h.OnClick(Message.ClickedSave())])

const barrelButton = (h: BarrelViewBuilder) =>
  h.button([h.OnClick(Message.ClickedSave())])

const directButton = (h: DirectViewBuilder) =>
  h.button([h.OnClick(Message.ClickedSave())])

export const view = DirectNestedComposition.view((_model, h) =>
  h.div([], [localButton(h), barrelButton(h), directButton(h)]),
)
