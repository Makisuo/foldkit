# Init & Flags

## The First Model {#init}

`init` constructs the first Model and returns any Commands that should run when the application starts. Author it through the named root Composition as `ApplicationComposition.init(fn)`. The helper preserves the function's exact arguments, return shape, Command requirements, and child registration evidence. It also owns the child startup graph used to assemble the complete Model.

Give `ApplicationComposition.init` one concrete function signature. Optional, default, and rest parameters are supported. When an overloaded domain helper or callable object supplies the startup logic, wrap that call in one concretely typed callback. A generic Block factory closes over its type parameters and keeps the initializer itself concrete.

The counter starts at zero and has no startup work:

::Snippet{name="initSimple" label="Using init"}

A non-routing application or element calls `init` with no arguments. A routing application passes the current URL, so its first Model can reflect the route. When the application declares Flags, they become the first argument in either form. `ApplicationComposition.toApplication` or `toElement` receives `init` explicitly and checks its arguments against the completion's Flags and routing configuration, along with the registered child and handler graph.

## Assemble Child Models {#child-initialization}

A completed Block carries its `init`. For a child stored in an exact required direct field, omit `init` when its initializer can be called without arguments. The Composition calls that initializer without arguments, places its Model, and collects its Commands automatically. When the initializer requires arguments, provide `init: { args }`. The callback is contextually typed and ordinary tuple literals preserve the child's exact init parameters.

Use `init: false` when the parent owns the required field at startup and supplies it in the init plan's `model`. For an exact `Option` field, omission also leaves presence with the parent. Choose automatic presence explicitly by returning `Option.none()` or `Option.some(args)` from `init.args`. Keyed and accessor Bindings likewise remain parent-owned when `init` is omitted; use `init.occurrences` or `init.args` when Composition should initialize them.

When several selectors read the same startup input, add a `Startup` Schema to the parent Definition. `Block.define` and `defineApplication` use that Schema to contextually type each owned `init.args` and `init.occurrences` callback. Put the decoded value in the Composition init plan's `startup` field when a selector uses it. A plan with no startup-dependent selector does not need that field.

The following Profile gives its Settings child a saved theme. The Binding selects the child inputs from `startup`, while the init plan supplies only the parent-owned username:

::Snippet{name="blockFoldChildInit" label="Assembling an initial child Model"}

`Composition.init` calls the selected child initializers once, in `childBindings` order. Its plan's `model` field contains only fields the parent owns; Foldkit adds the child-owned fields before constructing the Model. Use `startup` for input shared with Binding init policies, `commands` for parent Commands, and `steps` for parent Steps applied in order after the complete Model exists.

Parent Commands appear first in the returned collection, followed by retained child init Commands and Step Commands. The Runtime executes Commands independently, so collection order does not sequence their completion.

An exact Option field can select absence by returning `Option.none()` from `init.args`, or presence with `Option.some(args)`. The resulting field is `None` or `Some(childModel)`.

The final parent Model determines which initialized occurrences are active. Init Commands for absent or `presentWhen`-inactive children are omitted. A `subscriptions.when` policy only gates Subscription Streams; it does not suppress child init Commands. Initial Steps may change the child Model without discarding its init Commands.

These calls assemble values only. The Runtime constructs Layers and performs the returned Commands later.

For custom storage, deliberate Command ordering, or dynamic creation, call the registered Binding's explicit `init` operation from its owning graph. Pass `{ args, toParentModel }`, plus `key` for a keyed Binding and optional parent `commands`. `args` is the exact child init tuple. `toParentModel` receives the initialized child Model and constructs the complete parent Model. The result contains that parent Model and every lifted child init Command, followed by the optional parent Commands. It also retains the Binding evidence used by Composition completion.

An explicit Binding init may execute only where that exact Binding is registered: inside its Composition's init or update, through an operation exposed by its completed Block, or through the operation projected onto its parent Binding. The compiler checks the key, argument tuple, complete parent Model, Command requirements, and graph evidence. At runtime, Foldkit validates the complete parent Model against its Schema, verifies that `toParentModel` stores a schema-equivalent initialized child, and checks that a keyed result contains exactly one occurrence with the requested key. These checks apply to the connected operation; ordinary Model construction remains available for fixtures and other pure values.

### Keyed Initial Instances

A keyed-array Binding can declare `init.occurrences` and `init.toItem`. The first callback selects the ordered keys and exact child init argument tuples. The second builds each stored item from its occurrence and initialized child Model. For a direct child array, it returns that exact child Model with the planned key. For a wrapped array, it returns the parent-owned wrapper containing that exact child Model and key. The parent keeps occurrence IDs and any wrapper metadata outside the child Model.

This Counter application starts three instances. Its Model declares `counters: Schema.Array(CounterInstance)`, where each instance holds `id` and `counter`. Its `addCounter` Step creates a later occurrence through `CountersBinding.init({ key, args, toParentModel })`, so the returned parent result carries the child init Commands automatically:

::Snippet{name="initKeyedChildren" label="Initializing keyed child instances"}

The assembler validates the entire occurrence plan before calling child init. Duplicate keys, invalid keys, and non-array `args` fail with a configuration error. TypeScript checks tuple length and argument types. At a JavaScript boundary, the Runtime cannot reconstruct which initializer parameters were required, optional, defaulted, or rest parameters. Each wrapper must retain its planned key. Only keys present in the final parent Model retain their init Commands; initial Steps may change their child state.

This startup adapter applies to exact `field` / `key` keyed arrays, with or without `childField`. General keyed accessors keep explicit initialization so their custom storage and write policy remain visible.

## Compose Startup Steps {#startup-steps}

Composition-owned `init` is the application startup boundary. The plan's `startup` value is decoded input used while assembling that boundary; it does not create a separate Runtime phase. Foldkit does not run a special Runtime boot phase after it.

Put initial Steps in the plan's `steps` array. The Composition assembles the complete parent Model first, then passes each Step the Model returned by the preceding Step. It retains the child init Commands and adds the Commands returned by those Steps.

An optional `boot` helper is an ordinary exposed Step called through the Binding after the child Model is stored. It may accept Flags, the current URL, or prerendered data, and it returns the normal next Model and Commands through that Binding. A feature need not define both init and `boot` helpers.

When an existing domain operation such as `restore` or `open` already describes the transition, expose that Step instead. Do not create a Message only to trigger startup behavior.

The following excerpt assumes `SettingsBinding` and `SessionBinding` have init policies and expose startup operations. The `steps` array is sequential, so `SessionBinding.resume` receives the Model returned by `SettingsBinding.restore`. The result retains Commands from both child initializers and both Steps:

::Snippet{name="initBootSteps" label="Composing startup Steps"}

List each initial Step in `steps`. Composition applies them in order.

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
