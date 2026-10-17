import { Option } from 'effect'

// ❌ Bad
// The authored update receives a wrapper that belongs to the child Binding.
const BadDialogBinding = ApplicationDefinition.bindChild(Dialog.block, {
  field: 'dialog',
  toParentMessage: message => Message.GotDialogMessage({ message }),
  fromParentMessage: false,
})

const badUpdate = ApplicationComposition.makeUpdate((model, message) =>
  Message.match(message, {
    GotDialogMessage: ({ message }) => BadDialogBinding.fold(model, message),
    ClickedSave: () => ({ model }),
  }),
)

// ✅ Good
// The exact incoming route lets Composition deliver the wrapper.
const DialogBinding = ApplicationDefinition.bindChild(Dialog.block, {
  field: 'dialog',
  toParentMessage: message => Message.GotDialogMessage({ message }),
  fromParentMessage: {
    parentMessage: Message.GotDialogMessage,
    args: (_model, { message }) => Option.some([message]),
  },
})

const update = ApplicationComposition.makeUpdate((model, message) =>
  Message.match(message, {
    ClickedSave: () => ({ model }),
  }),
)
