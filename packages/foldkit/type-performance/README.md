# Block type performance

This harness measures deterministic TypeScript diagnostics for completed Block
composition through Foldkit's published declarations. Each checked-in fixture
imports public `foldkit` package entry points, completes its Block graph, and
finishes with `Application.update`, `Application.makeElement`, and
the completed program’s `.provide(...)` method.

The shared baseline contains the imports and warmup expressions repeated by
every fixture. Fixture cost is the fixture total minus that baseline for these
compiler diagnostics:

- `Instantiations` and `Types` are regression gates.
- `Symbols` is reported for context because symbol count alone is not a stable
  proxy for type computation.

The deep fixture connects a leaf through eight parent Blocks and then connects
the result to an Application. The other fixtures cover 100 sibling connections
with exhaustive Message folds and 200 distinct Command requirements. Every
fixture carries an ordinary Effect Service through Application completion and
provides its Layer. Run the check after building `packages/foldkit`:

```sh
pnpm check:block-type-performance
```

Pass a fixture name to measure only that fixture. Threshold updates are a
separate, explicit command and write the exact observed deltas without adding a
tolerance:

```sh
pnpm check:block-type-performance deep-composition-8
pnpm update:block-type-performance
pnpm update:block-type-performance command-requirements-200
```

Only update budgets after reviewing an intentional type-level change. The
ordinary check never changes them and fails when either gated metric exceeds
its stored maximum.
