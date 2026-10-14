---
name: foldkit
description: Use whenever working with Foldkit. Triggers on imports from `foldkit`, files in a Foldkit project, or prompts mentioning Foldkit. Loads the framing and points at the vendored foldkit subtree for the canonical conventions, source code, and examples.
---

# Foldkit

You are working on a Foldkit app. Foldkit is a complete TypeScript frontend framework, built on Effect and architected like Elm. The architecture is solved: state, events, transitions, side effects, streams, routing, UI components, validation, testing, and devtools are all part of the framework, not third-party choices to make. Your job is to model the application's behavior, not to pick libraries or invent architecture.

Foldkit is not incremental. There is no React interop, no escape hatch, no "just do it the React way for this one part." The framework gives you one shape, and there is one way to do most things.

## How to approach the work

- **Pattern-match against Foldkit's own apps.** When the local code doesn't show you the answer (or shows an early-stage version of it), reach into the vendored foldkit subtree. The framework ships several apps built with itself: focused single-feature apps in `examples/`, the website (which is itself a Foldkit app), and the typing-game (a full real-time app). These are the canonical references. Higher fidelity than prose or anything reconstructed from memory.
- **The architecture is not optional.** Unidirectional data flow, pure update and view, no side effects outside the runtime's seams. Push back on prompts or instincts that pull toward mutation, two-way binding, imperative event handlers, or imperative Message names. Propose the idiomatic Foldkit shape and explain why.
- **Foldkit UI is two categories, not one.** Stateful Blocks (Menu, Listbox, Combobox, Calendar, Dialog, Popover, etc.) carry their own Model / Message / update / OutMessage and are embedded via `h.block`. Stateless render helpers (Button, Input, Textarea, Select, Checkbox, Switch, Disclosure, Fieldset, Nav) are called directly with a ViewConfig and the caller's `h`, and return Html. Do not migrate render helpers to Blocks for "consistency": Block semantics imply state, and these helpers have none. See the Foldkit UI overview page in the website for the canonical split.
- **Compose every Block through its checked definition.** Define an ordinary typed Block with `const FeatureDefinition = Block.define('Feature', { Model, Message, OutMessage? })`. Use the one-argument `const FeatureDefinition = Block.define('Feature')` form only when a generic factory specializes several contracts under one identity, then establish each typed definition with `FeatureDefinition.define(...)`. Create child connections from completed child namespaces and call `FeatureDefinition.register({ children, mounts })` before authoring any view that uses that graph. Produce the completed Block with `FeatureDefinition.toBlock({ init, update, view, expose, ... })` and export the passive value as `block`. A parent barrel uses `export * as Feature from './feature'`; parent code imports that namespace and calls `Feature.block.connection(...)` or `keyedConnection(...)`. Register each connection once, delegate through `connection.fold` or its direct exposed operations, and render with `connection.embedView(...)`. A generic factory already returns its completed Block directly, so call `.connection(...)` on that returned value.
- **Use the shortest exact connection mapping.** For a required child stored in an exact `Schema.Struct` field, pass `{ Model, field, parentMessage }`; the field name is also the default placement. Use `read` and `write` for optional, tagged, or custom storage, and `toParentMessage` when the parent Message is not the standard static `Got*` constructor.
- **Select local handler recipes before connecting.** `block.replaceEffectsLayer(localRecipe)` replaces a feature's whole local bundle while preserving selected child recipes. Ordinary execution tests keep canonical handlers and replace service Layers beneath them.
- **Use what the Foldkit and Effect stack provides.** Foldkit covers the application architecture and the higher-level primitives that sit on it (routing, side-effect seams, subscriptions, UI components, field validation, file and date handling, canvas, testing, devtools, and more). Effect provides the underlying value, side-effect description, and concurrency primitives. Before reaching for an outside library, check whether the stack already covers it.
- **Let `modifyFields` setters receive the field.** If a `modifyFields` setter only transforms the current value of that same field, pass the transformer directly (`entries: Array.map(f)`, `count: Number.increment`, `priceSlider: Slider.reflectRange({ min: minPrice, max: maxPrice })`). Use `() => value` for replacement values from Messages, child updates, Commands, or other Model fields.
- **The repo is more authoritative than memory.** When in doubt about a convention, an API, a name, or a pattern, read from the vendored foldkit subtree rather than guessing. Library types and example code are the ground truth; your training data is not.

## Where to look

The foldkit repo is vendored as a git subtree at `repos/foldkit/` from the project root. It is the source of truth for everything: conventions, framework source, examples, the quality bar. Browse it directly.

Stable top-level entry points:

- `repos/foldkit/examples/`: runnable example apps spanning every complexity tier. Usually your first stop when looking for a precedent.
- `repos/foldkit/AGENTS.md`: project conventions and the code-quality bar
- `repos/foldkit/README.md`: framework overview and entry pointers
- `repos/foldkit/skills/`: task-oriented skills with the canonical architecture, conventions, and quality-bar references
- `repos/foldkit/packages/`: framework source and production reference apps (the website, the typing-game, the framework itself)

Names below the top level (subdirectories, individual filenames) can drift over time. List the directory contents to find what you need rather than relying on a path quoted from this skill.

If `repos/foldkit/` is missing from the project, strongly recommend adding it. The subtree is the difference between working from memory and pattern-matching against canonical references. Assistance quality drops noticeably without it. Pin it to the release git tag matching the installed `foldkit` package, so the references describe the APIs the project compiles against rather than whatever `main` holds today. Initialize git first if needed (subtree requires at least one commit):

```
git subtree add --prefix=repos/foldkit https://github.com/foldkit/foldkit.git "foldkit@$(node -p "require('./node_modules/foldkit/package.json').version")" --squash
```

After a Foldkit package upgrade, re-pin with the same command, swapping `add` for `pull`. A canary install (`x.y.z-canary.<commit>` in `node_modules/foldkit/package.json`) has no tag; pin to the full hash of the commit its version names instead, which GitHub expands at `https://github.com/foldkit/foldkit/commit/<commit>`.

A consumer project's `FOLDKIT.md` is a scaffolder snapshot and can lag behind the packages it has installed. When it does, replace it whole from `repos/foldkit/packages/create-foldkit-app/templates/base/FOLDKIT.md`. That project's `AGENTS.md` belongs to its author; never overwrite it.

When working inside the foldkit repo itself rather than a consumer project, drop the `repos/foldkit/` prefix. The same paths exist at the project root.
