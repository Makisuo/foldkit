import { Option, Schema } from 'effect'
import { Block, Update } from 'foldkit'
import type { HtmlBuilder } from 'foldkit/html'
import { modifyFields } from 'foldkit/struct'

import { Child } from './child'
import { Message as NestedMainMessage } from './child/main'
import { Message as DirectChildMessage } from './child/message'
import { GotChildMessage, Message as OwnMessage } from './message.js'
import { Model } from './model'
import { Message as AliasMessage } from '@/message'

// UPDATE

const foldChildSave = Update.foldChildStep({
  update: Child.save,
  read: (model: Model) => Option.some(model.child),
  write: (model, child) => modifyFields(model, { child: () => child }),
  toParentMessage: message => GotChildMessage({ message }),
})

export const update = (model: Model) => foldChildSave(model)

// CHILD VIEW

const saveButton = (h: HtmlBuilder<Child.Message>) =>
  h.button([h.OnClick(Child.Message.ClickedSave())])

const ChildViewDefinition = Block.define('ChildView')
const childView = ChildViewDefinition.define({
  Model: Child.Model,
  Message: Child.Message,
})
export const view = childView.view((_model, h) => saveButton(h))

const DirectMessageViewDefinition = Block.define('DirectMessageView')
const directMessageDefinition = DirectMessageViewDefinition.define({
  Model: Child.Model,
  Message: DirectChildMessage,
})
export const directMessageView = directMessageDefinition.view((_model, h) =>
  h.button([h.OnClick(DirectChildMessage.ClickedSave())]),
)

const NestedMainMessageViewDefinition = Block.define('NestedMainMessageView')
const nestedMainMessageDefinition = NestedMainMessageViewDefinition.define({
  Model: Child.Model,
  Message: NestedMainMessage,
})
export const nestedMainMessageView = nestedMainMessageDefinition.view(
  (_model, h) => h.button([h.OnClick(NestedMainMessage.ClickedSave())]),
)

export const childStep = childView.step(model => ({
  model,
  message: Child.Message.ClickedStepSave(),
}))

export type ChildMessage = typeof Child.Message.Type

export const isClickedSave = Schema.is(Child.Message.ClickedSave)

export const ownMessage = () => OwnMessage.ClickedSave()

export const aliasMessage = () => AliasMessage.ClickedSave()

export const localMessage = (Child: unknown) =>
  (Child as { Message: { ClickedSave: () => unknown } }).Message.ClickedSave()

let mutableChildMessage = Child.Message

export const mutableMessage = () => mutableChildMessage.ClickedSave()

export const computedMessage = () => Child['Message'].ClickedSave()
