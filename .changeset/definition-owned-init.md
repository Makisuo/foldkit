---
'foldkit': minor
'create-foldkit-app': patch
---

Author initializers through their Application or Block Definition. `Application.init(fn)` and `Search.init(fn)` check the returned Model and the result Messages of returned Commands where the initializer is declared. They return the original function, preserving its exact arguments, return type, Command requirements, and evidence of child registration.

Before:

```ts
import { Runtime } from 'foldkit'

import { type Flags } from './flags'
import { type Message } from './message'
import { Model } from './model'

export const init: Runtime.ApplicationInit<Model, Message, Flags> = flags => ({
  model: Model.make({ count: flags.initialCount }),
})
```

After, import the Definition from its early declaration module so initializer and Command modules can use it without importing the completed application:

```ts
import { Application } from './definition'
import { type Flags } from './flags'
import { Model } from './model'

export const init = Application.init((flags: Flags) => ({
  model: Model.make({ count: flags.initialCount }),
}))
```

For a Block, use the same method on its Definition:

```ts
import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'

export const Search = Block.define('Search', { Model, Message })

export const init = Search.init((query: string) => ({
  model: Model.make({ query }),
}))
```

Initializers use one concrete function signature. Optional, default, and rest parameters are supported. Wrap an overloaded domain helper in a concretely typed initializer callback instead of passing its overload set to `init`. Generic Block factories can capture their type parameters outside the initializer. Foldkit rejects callable shapes it cannot check without changing their argument or result types.

Pass the authored `init` to the same `Composition.toApplication`, `toElement`, or `toBlock` completion method as before. Completion still checks the initializer against Application Flags and routing configuration, handler provision, and registered child Bindings. Compositions do not expose a second `init` authoring method.

The helper neither calls the initializer nor starts effects. The Runtime invokes Application initialization and executes returned Commands. A Binding's existing `init(...)` still initializes its child and lifts its Commands into the parent. Public UI helpers that directly construct a Model keep their existing return shape; their Block initializer adapters use the owned helper.
