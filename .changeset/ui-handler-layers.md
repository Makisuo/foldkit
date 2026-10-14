---
'@foldkit/ui': minor
---

Expose each stateful Foldkit UI component as a completed Block. Connect components at the Block that owns them and register those connections under `children`. Composition then carries their handler Layers, Mounts, Subscriptions, and ManagedResources to the application root.

Before:

```ts
import { Submodel } from 'foldkit'
import { Menu, Tabs } from '@foldkit/ui'

const AppMenu = Menu.create<string>()
const AppTabs = Tabs.create<Tab>()

export const mounts = Menu.mounts

export const view = Submodel.defineView<Model, Message>((model, h) =>
  h.submodel({
    slotId: model.menu.id,
    model: model.menu,
    view: AppMenu.view,
    viewInputs: menuViewInputs,
    toParentMessage: message => Message.GotMenuMessage({ message }),
  }),
)
```

After:

```ts
import { Menu, Tabs } from '@foldkit/ui'
import { Block } from 'foldkit'

import { Model, type Tab } from './model'
import { Message } from './message'
import { foldMenuOutMessage, foldTabsOutMessage } from './outMessage'
import { menuViewInputs } from './viewInputs'

const AppMenu = Menu.create()
const AppTabs = Tabs.create<Tab>()

const menu = AppMenu.connection({
  Model,
  field: 'menu',
  parentMessage: Message.GotMenuMessage,
  outMessage: { fold: foldMenuOutMessage },
})

const tabs = AppTabs.connection({
  Model,
  field: 'tabs',
  parentMessage: Message.GotTabsMessage,
  outMessage: { fold: foldTabsOutMessage },
})

const PanelDefinition = Block.define('Panel', { Model, Message }).register({
  children: [menu, tabs],
})

export const view = PanelDefinition.view((model, h) =>
  h.block(
    menu.embedView({
      slotId: model.menu.id,
      model: model.menu,
      viewInputs: menuViewInputs,
    }),
  ),
)
```

Do not export or compose a package-wide UI handler bundle. Register only the components the owner actually embeds. A connection makes the parent-child relationship explicit once and gives update `connection.fold` for received child Messages and direct named operations such as `connection.open()` for parent-driven changes, while view uses `connection.embedView`.

Factories live on the component namespace: `Combobox.create`, `Combobox.Multi.create`, `Listbox.create`, `Listbox.Multi.create`, `Menu.create`, `Tabs.create`, `RadioGroup.create`, `VirtualList.create`, and `Toast.make`. Factory instances retain stable local names; connection placement and keys distinguish occurrences. Toast no longer needs a caller-supplied effect name. Schema-taking factories such as `Combobox.create(City)` preserve decoded Item payloads. Type-only factories such as `Tabs.create<Tab>()` preserve the selected value type. Import ViewInputs and domain helpers from component subpaths; the completed value itself carries its Model, Message, and declared OutMessage matcher.

```ts
import { Toast } from '@foldkit/ui'
import { Schema } from 'effect'

import { Model } from './model'
import { Message } from './message'
import { foldToastOutMessage } from './outMessage'

const ToastPayload = Schema.Struct({ message: Schema.String })
const AppToast = Toast.make(ToastPayload)

const toast = AppToast.connection({
  Model,
  field: 'toast',
  parentMessage: Message.GotToastMessage,
  outMessage: { fold: foldToastOutMessage },
})
```

The connection contributes Toast's swipe Subscription and handler recipe automatically. Scene swipe events continue to use `Subscription.emit` with the registration reached through the completed Block.

For dynamic keyed component collections, use `block.keyedConnection` instead of manually lifting each lifecycle registry. Every rendered occurrence needs a stable string or number key.

```ts
import { Dialog } from '@foldkit/ui'

import { Model } from './model'
import { Message } from './message'
import { replaceDialog } from './dialog'
import { foldDialogOutMessage } from './outMessage'

const dialogs = Dialog.block.keyedConnection({
  readAll: (model: Model) => model.dialogs,
  key: dialog => dialog.id,
  read: dialog => dialog.model,
  writeAt: (model, dialogId, nextDialog) =>
    replaceDialog(model, dialogId, nextDialog),
  toParentMessage: (dialogId, message) =>
    Message.GotDialogMessage({ dialogId, message }),
  outMessage: { fold: foldDialogOutMessage },
})
```

Stateless render helpers such as Button, Input, Textarea, Select, Fieldset, Checkbox, Switch, Disclosure, and Nav remain direct view functions. They do not need connections because they own no Model or lifecycle graph.
