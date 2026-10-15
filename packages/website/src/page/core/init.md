# Init & Flags

## The First Model {#init}

`init` constructs the first Model and returns any Commands that should run when the application starts. Author it through the root Definition as `Application.init(fn)`. The helper returns the same function with its exact arguments, return shape, Command requirements, and child registration evidence. It checks the returned Model and Command result Messages against the Application contracts where the initializer is declared.

Give `Application.init` one concrete function signature. Optional, default, and rest parameters are supported. When an overloaded domain helper or callable object supplies the startup logic, wrap that call in one concretely typed callback. A generic Block factory closes over its type parameters and keeps the initializer itself concrete, so the Definition can check one unambiguous Model and Message contract.

The counter starts at zero and has no startup work:

::Snippet{name="initSimple" label="Using init"}

A non-routing application or element calls `init` with no arguments. A routing application passes the current URL, so its first Model can reflect the route. When the application declares Flags, they become the first argument in either form. The Definition preserves that parameter list without deciding which case it represents. `ApplicationComposition.toApplication` or `toElement` still receives `init` explicitly and checks its arguments against the completion's Flags and routing configuration, along with the registered child and handler graph. Composition has no `init` authoring method.

## Compose Startup Steps {#startup-steps}

Definition-owned `init` is the application startup boundary. Foldkit does not run a special Runtime boot phase after it.

Start each child with its Binding's `init`, then build the complete parent Model. Child init may return Commands, so keep those Commands when applying any initial transitions.

An optional `boot` helper is an ordinary exposed Step called through the Binding after the child Model is stored. It may accept Flags, the current URL, or prerendered data, and it returns the normal next Model and Commands through that Binding. A feature need not define both init and `boot` helpers.

When an existing domain operation such as `restore` or `open` already describes the transition, expose that Step instead. Do not create a Message only to trigger startup behavior.

The following excerpt assumes `settings` and `session` are registered child Bindings, and that both expose a startup operation. The two Steps are sequential, so `Update.combine` passes the Model returned by `settings.restore` to `session.resume`. The final result retains Commands from both child init calls and both Steps:

::Snippet{name="initBootSteps" label="Composing startup Steps"}

Call a single initial Step directly. Use `Update.combine` only when two or more Steps must receive the Model produced by the preceding Step.

## Startup Data from Flags {#flags}

Flags carry data from outside the application into `init`. Typical sources include persisted state, runtime configuration, and request-specific data supplied during server rendering.

Define the boundary with a Flags Schema. For a fresh client start, also define an Effect that obtains a value matching that Schema:

::Snippet{name="flagsDefinition" label="Flags definition"}

`init` receives the decoded Flags value and folds it into the first Model:

::Snippet{name="initWithFlags" label="Using init with Flags"}

### Fresh Client Start

This compact Counter keeps the graphless root in `application.ts` with its Model, Message, init, update, and view. It creates `ApplicationComposition` with `Application.toComposition()`. The entry imports that Composition and passes the Schema to its owned `toApplication` method as `Flags`.

::Snippet{name="counterApplicationWithFlags" label="Application configuration with Flags"}

Define the browser storage provider in `services.ts`:

::Snippet{name="counterServices" label="Application storage provider"}

The entry imports `ApplicationLayer`, chooses the container and passes the Flags Effect to `Runtime.run`. The runtime resolves the Effect before calling `init`. If the configuration omits the Schema, `init` takes no Flags argument and the compiler rejects mismatched wiring.

::Snippet{name="counterEntryWithFlags" label="Flags wiring"}

The Flags Effect leaves `KeyValueStore` in its requirements, and the completed application supplies the browser provider through `application.provide(ApplicationLayer)`. A whole-application test can supply a deterministic store through the same method. The runtime builds the Layer once and shares it with Flags, Commands, and Subscriptions that require the same service. See [Layers](/core/layers) for the full setup.

### Server Rendering and Hydration

#### Server-Supplied Flags

Server rendering provides Flags from the request or build instead of running a client Flags Effect. `Server.renderToString(Application, { init, update, view, Flags }, { flags })` uses that value to call `init`, encodes it through the Schema, and embeds the result in the HTML. List every completion field explicitly, importing it from its real owner. `Runtime.hydrate` decodes the same value and calls the same `init`, so the client reconstructs the Model that produced the server HTML.

#### Handoff Validation

A hydrating entry does not provide a client Flags Effect. Missing or invalid handoff data fails startup instead of silently constructing a different Model. The [Server Rendering](/core/server-rendering#flags-and-what-only-the-browser-knows) guide explains which data is safe and reproducible across that boundary.

#### Block Decomposition

Once one Model, Message union, and update function become too large to reason about as a unit, decompose the state machine into [Blocks](/core/block). Each child owns its own Model, Messages, update, and Commands behind an explicit parent boundary.
