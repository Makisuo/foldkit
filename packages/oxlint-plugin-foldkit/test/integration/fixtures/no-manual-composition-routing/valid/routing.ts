import { Option } from 'effect'
import { defineApplication } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

import { foreignComposition, foreignDefinition } from 'third-party'

const Message = defineMessageUnion({
  GotDialogMessage: { message: Dialog.Message },
  GotPickerMessage: { message: Picker.Message },
  GotSharedMessage: { message: Shared.Message },
  ClickedSave: {},
})
const Application = defineApplication({ Model, Message })

defineMessageUnion({
  GotSettingsMessage: { message: Settings.Message },
})

Application.bindChild(Silent.block, { field: 'silent' })

Application.bindChild(Dialog.block, {
  field: 'dialog',
  parentMessage: Message.GotDialogMessage,
})

Application.bindChild(Picker.block, {
  field: 'picker',
  toParentMessage: message => Message.GotPickerMessage({ message }),
  fromParentMessage: {
    parentMessage: Message.GotPickerMessage,
    args: (_model, { message }) => Option.some([message]),
  },
})

const sharedMapping = {
  field: 'shared',
  toParentMessage: message => Message.GotSharedMessage({ message }),
}

Application.bindChild(Shared.block, { ...sharedMapping })

const ApplicationComposition = Application.makeComposition()

ApplicationComposition.makeUpdate((model, message) =>
  Message.match(message, {
    ClickedSave: () => ({ model }),
  }),
)

ApplicationComposition.makeUpdate((model, message) =>
  message._tag === 'ClickedSave' ? { model } : { model },
)

ApplicationComposition.makeUpdate((model, message) => {
  const inspectLocalMessage = (message: { _tag: string }) =>
    message._tag === 'GotLocalMessage'
  inspectLocalMessage({ _tag: message._tag })

  return { model }
})

DialogBinding.fold(model, message)

foreignComposition.makeUpdate((model, message) =>
  ParentMessage.match(message, {
    GotForeignMessage: () => ({ model }),
  }),
)

const localForeignComposition = foreignDefinition.makeComposition()
localForeignComposition.makeUpdate((model, message) =>
  ParentMessage.match(message, {
    GotForeignMessage: () => ({ model }),
  }),
)
