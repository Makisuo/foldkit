import { define as defineApplication } from 'foldkit/application'
import { Layer, Option } from 'effect'
import { Block, Command as ChildCommand } from 'foldkit'
import { modifyFields } from 'foldkit/struct'
import { Child } from './child'
import { ForwardedChildMessage } from './message'
import { Model } from './model'

const GotLocallyShadowedMessage = (input: { message: Child.Message }) => input

const InlineChild = Block.define('InlineChild', {
  Model: Child.Model,
  Message: Child.Message,
})
  .toComposition({})
  .toBlock({
    init: Child.init,
    update: Child.update,
    EffectsLayer: Layer.empty,
  })

const Application = defineApplication({ Model, Message })
export const inlineChild = Application.bindChild(InlineChild, {read: (model: Model) => Option.some(model.child),
write: (model, child) => modifyFields(model, { child: () => child }),
toParentMessage: message => ForwardedChildMessage({ message })})

// UPDATE

export const update = (model: Model, message: Child.Message) => {
  const childUpdate = Child.update(model.child, message)
  const commands = ChildCommand.mapMessages(
    childUpdate.commands,
    childMessage => ForwardedChildMessage({ message: childMessage }),
  )
  const shadowedCommands = ChildCommand.mapMessages(
    childUpdate.commands,
    childMessage => GotLocallyShadowedMessage({ message: childMessage }),
  )
  return {
    model: modifyFields(model, { child: () => childUpdate.model }),
    commands: [...commands, ...shadowedCommands],
  }
}
