---
'foldkit': minor
---

Add owned `Application.makeElement` for container-scoped applications. It captures the typed definition's Model, Message, and registered children. Completion infers requirements from Flags, init and update Commands, Subscriptions, Mounts, and ManagedResources. The standalone `provide` utility satisfies ordinary Service requirements before `Runtime.run` or `Runtime.embed` starts the Element.

**Before**

```ts
import { Runtime } from 'foldkit'
import { Model, init, update, view } from './main'
import { ServicesLayer } from './resources'

const element = Runtime.makeElement({
  Model,
  init,
  update,
  view,
  ports,
  container,
  resources: ServicesLayer,
})

const handle = Runtime.embed(element)
```

**After**

```ts
import { Runtime } from 'foldkit'
import { provide } from 'foldkit/application'
import { Application, init, update, view, ports } from './application'
import { ApplicationLayer } from './services'

const element = Application.makeElement({
  init,
  update,
  view,
  ports,
  container,
})

const handle = Runtime.embed(provide(element, ApplicationLayer))
```

Preserve existing Flags and other host configuration. Include local lifecycle declarations and `EffectsLayer` in completion when present. Registered children contribute their declarations and handler recipes automatically.

Provided variants of one Element share its embed activity and disposal ordering. Only one variant can be embedded at a time, and embedding after disposal waits for the previous runtime's cleanup.
