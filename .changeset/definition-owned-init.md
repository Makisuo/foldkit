---
'foldkit': minor
'create-foldkit-app': patch
---

Author initializers through the named Composition. `ApplicationComposition.init(fn)` and `SearchComposition.init(fn)` check parent-owned Model fields, shared child input, returned Commands, and startup Steps against the registered graph while preserving the callback's arguments and requirements.

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

After, import the named Composition that owns application initialization:

```ts
import { ApplicationComposition } from './composition'
import { type Flags } from './flags'

export const init = ApplicationComposition.init((flags: Flags) => ({
  model: { count: flags.initialCount },
}))
```

For a graphless Block, create and reuse a named empty Composition:

```ts
import { Block } from 'foldkit'

import { Message } from './message'
import { Model } from './model'

export const Search = Block.define('Search', { Model, Message })
export const SearchComposition = Search.toComposition()

export const init = SearchComposition.init((query: string) => ({
  model: Model.make({ query }),
}))
```

Initializers use one concrete function signature. Optional, default, and rest parameters are supported. Wrap an overloaded domain helper in a concretely typed initializer callback instead of passing its overload set to `init`. Generic Block factories can capture their type parameters outside the initializer. Foldkit rejects callable shapes it cannot check without changing their argument or result types.

Pass the authored `init` to that same Composition's `toApplication`, `toElement`, or `toBlock` completion method. Completion still checks the initializer against Application Flags and routing configuration, handler provision, and registered child Bindings. Definitions continue to own effects, Steps, lifecycle definitions, and `bindChild`; they no longer expose `init` or `update` authoring aliases.

The helper neither calls the initializer nor starts effects. The Runtime invokes Application initialization and executes returned Commands. Public UI helpers that directly construct a Model keep their existing return shape; their Block initializer adapters use the owned helper.

## Initialize children in their registered graph

Declare ordinary startup with the Binding's `init` policy. For dynamic children or custom storage, `Binding.init` now constructs the complete parent result. Supply the child arguments, the keyed occurrence's `key` when applicable, and `toParentModel` to store the initialized child. Foldkit retains and lifts its Commands automatically.

Earlier Binding form:

```ts
import { Array, Number } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { CountersBinding } from './composition'

const counterInit = CountersBinding.init(id)
return {
  model: modifyFields(model, {
    counters: Array.append({ id, counter: counterInit.model }),
    nextCounterId: Number.increment,
  }),
  commands: counterInit.commands,
}
```

Replacement inside a Composition-authored update handler:

```ts
import { Array, Number } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { CountersBinding } from './composition'

return CountersBinding.init({
  key: id,
  args: [],
  toParentModel: counter =>
    modifyFields(model, {
      counters: Array.append({ id, counter }),
      nextCounterId: Number.increment,
    }),
})
```

The compiler checks child arguments, key and parent Model types, and retains Command requirements and Binding evidence. Completion checks that evidence against the registered graph. Optional `commands` adds parent Commands after the child's lifted Commands without unpacking the result.

Runtime initialization requires that exact Binding in the active graph. Invoke it from Composition-authored init or update, or from a completed Block's exposed operation. A raw authored Step that initializes a child needs this execution boundary; call the completed Block's `expose` operation when testing it directly. Runtime checks reject an incomplete parent Model and a mapping that discards the child, selects the wrong key, or stores duplicate occurrences at that key. Parent Schema constructors may reconstruct an equivalent child Model. Numeric zero and negative zero identify the same occurrence, matching the runtime's Map and Set key equality.

Ordinary Model construction remains available. The check applies to connected initialization; it does not make arbitrary parent Model projections retain Binding provenance.
