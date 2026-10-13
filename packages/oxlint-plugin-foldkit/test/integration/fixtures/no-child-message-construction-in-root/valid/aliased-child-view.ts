import { Block } from 'foldkit'

import { Child } from './child'

const save = Child.Message.ClickedChildViewSave

const AliasedChildView = Block.define('AliasedChildView')
const childView = AliasedChildView.define({
  Model: Child.Model,
  Message: Child.Message,
})

export const view = childView.view((_model, h) =>
  h.button([h.OnClick(save())]),
)
