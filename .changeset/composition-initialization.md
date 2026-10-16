---
'foldkit': minor
'create-foldkit-app': patch
---

Declare child startup inputs beside their Bindings and assemble their initial Models and Commands through the owning Composition. A completed Block already carries its initializer; the parent now supplies the startup policy without repeating Model placement and Command collection.

Use `init: true` when the child's init accepts no arguments. Use `init: { args }` when it needs inputs. The callback returns the exact child init argument tuple through Effect's `Tuple.make(...)`. An optional field returns `Option<tuple>` so the parent can select absence without calling child init.

Author the complete startup plan with `ApplicationComposition.init` or `FeatureComposition.init`. The callback supplies shared child input through `startup`, returns fields owned by the parent, and may list Commands and startup Steps. It does not construct Layers or execute Commands.

## Declare startup beside the Binding

Before, manually initialize a registered child, put its Model into the parent, and retain its Commands:

```ts
import { SettingsBinding } from './composition'
import { Application } from './definition'
import type { Flags } from './flags'
import { Model } from './model'

export const init = Application.init((flags: Flags) => {
  const settingsInit = SettingsBinding.init({ theme: flags.savedTheme })

  return {
    model: Model.make({
      username: flags.username,
      settings: settingsInit.model,
    }),
    commands: settingsInit.commands,
  }
})
```

After, declare those inputs with the Binding in composition.ts:

```ts
import { Tuple } from 'effect'

import { Application } from './definition'
import type { Flags } from './flags'
import { Message } from './message'
import * as Settings from './settings'

export const SettingsBinding = Application.bindChild(Settings.block, {
  field: 'settings',
  parentMessage: Message.GotSettingsMessage,
  init: {
    args: (flags: Flags) => Tuple.make({ theme: flags.savedTheme }),
  },
})

export const ApplicationComposition = Application.toComposition({
  childBindings: [SettingsBinding],
})
```

Then let the Composition collect child Models and Commands in init.ts:

```ts
import { ApplicationComposition } from './composition'
import type { Flags } from './flags'

export const init = ApplicationComposition.init((flags: Flags) => ({
  startup: flags,
  model: {
    username: flags.username,
  },
}))
```

The assembler calls selected child initializers once in `childBindings` order and merges their fields with the parent-owned fields. It preserves parent Commands first, child init Commands second, and startup Step Commands last. The Runtime still executes Commands independently; collection order does not sequence their completion. A child initializes its own descendants through its completed init; the assembler does not initialize them a second time.

The final Model determines active occurrences. Init Commands for children absent or gated by `presentWhen` are omitted. `subscriptions.when` only gates Subscription Streams. A boot Step may update initialized child state without discarding its init Commands.

A Binding without an `init` policy leaves its Model field under parent ownership. Use that form for custom storage and dynamic children created later in update.

## Select initial keyed instances

A keyed-array Binding can select its initial instances with `init.occurrences` and construct its stored items with `init.toItem`. Each occurrence has a stable key and the exact child init argument tuple. The assembler calls child init once per occurrence and lifts its Commands through that key. For a direct array, `toItem` returns the exact initialized child Model with the planned key. For a wrapped array, it returns the parent-owned wrapper containing that exact child Model and key.

```ts
import { Array, Option, Tuple } from 'effect'

import { Application } from './definition'
import { Message } from './message'
import { CounterInstance, Model } from './model'
import * as Counter from './counter'

const INITIAL_COUNTER_COUNT = 3

const CountersBinding = Application.bindChild(Counter.block, {
  field: 'counters',
  key: 'id',
  childField: 'counter',
  toParentMessage: (id, message) => Message.GotCounterMessage({ id, message }),
  fromParentMessage: {
    parentMessage: Message.GotCounterMessage,
    args: (_model, { id, message }) => Option.some([id, message]),
  },
  init: {
    occurrences: () =>
      Array.makeBy(INITIAL_COUNTER_COUNT, counterId => ({
        key: `counter-${counterId}`,
        args: Tuple.make(),
      })),
    toItem: ({ key }, counter) => CounterInstance.make({ id: key, counter }),
  },
})

const ApplicationComposition = Application.toComposition({
  childBindings: [CountersBinding],
})

const init = ApplicationComposition.init(() => ({
  model: {
    nextCounterId: INITIAL_COUNTER_COUNT,
  },
}))
```

The occurrence plan is validated before any child initializes. Duplicate keys, non-array `args`, and wrappers that change their planned key are rejected at runtime. Tuple length and element types are checked by the compiler; init arguments are not decoded at runtime. `Option.none()` from `fromParentMessage.args` ignores a stale or inactive keyed Message without changing the Model. General keyed accessor storage remains explicit; this adapter does not add HashMap initialization.

## Name child Bindings explicitly

Register child Bindings under `childBindings` rather than `children`. Name constructed values `SettingsBinding`, `HomeBinding`, and similar PascalCase names. Model and DOM fields named `children` are unaffected. Feature and extracted policy namespaces keep their feature names, such as `Home`; an extracted factory remains `Home.bind(...)`.
