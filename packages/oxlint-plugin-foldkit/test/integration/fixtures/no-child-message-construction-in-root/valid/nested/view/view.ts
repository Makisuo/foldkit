import { Block } from 'foldkit'

import {
  NestedComposition as DirectNestedComposition,
  type NestedViewBuilder as DirectNestedViewBuilder,
} from '../composition/composition.js'
import {
  NestedComposition,
  type NestedViewBuilder as BarrelNestedViewBuilder,
} from '../composition/index.js'
import { Message } from '../definition.js'

type NestedViewBuilder = Block.ViewBuilderFor<typeof NestedComposition>

const localButton = (h: NestedViewBuilder) =>
  h.button([h.OnClick(Message.ClickedSave())])

const barrelButton = (h: BarrelNestedViewBuilder) =>
  h.button([h.OnClick(Message.ClickedSave())])

const directButton = (h: DirectNestedViewBuilder) =>
  h.button([h.OnClick(Message.ClickedSave())])

export const view = DirectNestedComposition.view((_model, h) =>
  h.div([], [localButton(h), barrelButton(h), directButton(h)]),
)
