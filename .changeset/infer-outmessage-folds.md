---
'foldkit': minor
---

Author parent OutMessage folds with `Definition.makeOutMessageFold(ChildBlock, handlers)`. The owning Definition supplies the parent Model, Message, and OutMessage contracts; the completed child supplies its exact OutMessage payloads and Command-lifting context. Each named variant returns a parent Step. The helper preserves the inferred Command requirements and sibling Binding registration evidence.

**Before**

```ts
import type { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import type { Message } from './message'
import type { Model } from './model'
import { TabsBlock } from './tabs'

const foldTabsOutMessage = TabsBlock.OutMessage.match<
  Update.Step<Model, Message>,
  typeof TabsBlock.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { currentTab: () => value }),
    }),
})
```

**After**

```ts
import { modifyFields } from 'foldkit/struct'

import { ApplicationDefinition } from './definition'
import { TabsBlock } from './tabs'

const foldTabsOutMessage = ApplicationDefinition.makeOutMessageFold(TabsBlock, {
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { currentTab: () => value }),
    }),
})

const TabsBinding = ApplicationDefinition.bindChild(TabsBlock, {
  field: 'tabs',
  outMessage: { fold: foldTabsOutMessage },
})
```

The helper requires every child OutMessage variant and rejects incompatible parent Models, result Messages, and parent OutMessages. Generic UI payloads retain their literal refinements. A variant may return an existing owned Step or a connected sibling operation; its Command requirements and registration obligations remain part of the parent Composition's checks.

A variant that lifts child Commands receives its typed `FoldContext` as a second parameter. Keep a keyed Binding's key parameter in its policy when parent behavior depends on that key. Forward-only OutMessage mappings continue to use the child's union matcher.

Keep the child's exhaustive `OutMessage.match` for a policy that makes TypeScript report a recursive initializer through its own Binding or a reciprocally defined sibling Binding. Author its Steps through the parent Definition; Composition still checks registration. This preserves the existing inference path without weakening the new helper's validation.

This also rejects mixed update branches that return an unapplied Step or an incompatible result beside a valid result. Apply a connected operation to the provided Model before returning it from `Composition.makeUpdate`, or compose it through the existing Step APIs. An OutMessage fold returns a Step because its Binding applies that Step after writing the next child Model. That Step must return a result or connected result recipe. Use the owning `Definition.step` when delegating to another Step or returning a Binding init recipe, so its normalization happens before the Binding consumes the result.
