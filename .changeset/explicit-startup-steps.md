---
'@foldkit/ui': minor
'foldkit': patch
'create-foldkit-app': patch
---

Make feature startup transitions ordinary Steps. `init` constructs the baseline Model and may return Commands. When a feature needs a separate initial transition using a URL, Flags or prerendered data, expose that transition as a Step and apply it through the child Binding after constructing the parent Model. A helper named `boot` follows this convention; the Runtime has no separate boot phase. A simple feature can use only `init`.

### Initially open Dialogs

`Dialog.boot` is removed. Initialize a closed Dialog through its Binding, then apply the Binding's existing `open()` Step. The Step lifts `ShowDialog` and handles `Opened` through the configured OutMessage policy. Return Commands from both initialization and opening.

Before:

```ts
import { Update } from 'foldkit'
import { Dialog } from '@foldkit/ui'

import { Message } from './message'
import { Model } from './model'
import { foldDialogOutMessage } from './operation'

return Update.foldChildInit(Dialog.boot({ id: 'confirm' }), {
  toParentModel: dialog => Model.make({ dialog }),
  toParentMessage: message => Message.GotDialogMessage({ message }),
  foldOutMessage: foldDialogOutMessage,
})
```

After, declare and register the Binding in application.ts:

```ts
import { defineApplication } from 'foldkit'
import { Dialog } from '@foldkit/ui'

import { Message } from './message'
import { Model } from './model'
import { foldDialogOutMessage } from './operation'

export const Application = defineApplication({ Model, Message })
export const dialog = Application.bindChild(Dialog.block, {
  field: 'dialog',
  parentMessage: Message.GotDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
})
export const ApplicationComposition = Application.toComposition({
  children: [dialog],
})
```

Then construct the parent and open the Dialog in init.ts. This example's `foldDialogOutMessage` handles `Opened` and `Closed` locally, so the root returns Model and Commands:

```ts
import { Application, dialog } from './application'
import { Model } from './model'

export const init = Application.init(() => {
  const dialogInit = dialog.init({ id: 'confirm' })
  const initialModel = Model.make({ dialog: dialogInit.model })
  const dialogOpen = dialog.open()(initialModel)

  return {
    model: dialogOpen.model,
    commands: [...(dialogInit.commands ?? []), ...(dialogOpen.commands ?? [])],
  }
})
```

For two or more initial Steps, use `Update.combine(initialModel, [firstStep, secondStep])` when a later Step must receive the Model produced by an earlier one. Accumulate child init Commands and the combined Step Commands in the root result. Step order sequences Model transitions; returned Commands execute independently.

The Init, Block and Dialog guides and generated application guidance explain when a startup Step earns its place. Messages record actual facts; startup code can share pure transition logic with update without dispatching synthetic request or success Messages.
