# @foldkit/oxlint-plugin

Oxlint rules for Foldkit applications. Extend `recommended.json` for the full supported convention set, or `all.json` to enable every rule. Both presets enable `foldkit/block-name-matches-variable` at error severity.

`foldkit/no-manual-composition-routing` keeps registered child wrapper routing out of authored Composition updates. It reports disabled incoming routes, spread-free inline custom mappings that omit their incoming route, and manual `Got*` handling in callbacks owned by a Composition. Wrapper Schema declarations and standalone Binding folds remain valid, and the presets disable the rule in tests.

`foldkit/block-name-matches-variable` requires a direct literal Block authoring declaration to use the `<BlockId>` identifier. A Composition derived in the same file uses `<BlockId>Composition`:

```ts
const People = Block.define('People', { Model, Message })
const PeopleComposition = People.makeComposition()
```

Application authoring values use `Application`, and their Compositions use `ApplicationComposition`. The rule follows supported `foldkit` root, `foldkit/block`, and `foldkit/application` imports, including namespace and import aliases. It follows inline chains and authoring values declared in the same file. A Composition derived from an authoring value imported from another local module is not verified because Oxlint does not expose cross-module symbol or type information. Dynamic names are left for the developer to review.

Rules that inspect HTML builder calls share provenance-aware recognition. They recognize `HtmlBuilder`, `Block.ViewBuilderFor<typeof FooComposition>`, local aliases of those types, owner-specific ViewBuilder types imported from a relative module, and the builder parameter of `FooComposition.makeView` and `makeView.withInputs` callbacks. For an imported alias, the plugin resolves the relative TypeScript module and explicit re-export barrels until it finds an actual exported `Block.ViewBuilderFor` declaration; declaration-like text in comments and string literals is ignored. This covers extracted view helpers while leaving unrelated types named `*ViewBuilder` alone. Package aliases, wildcard re-exports, JavaScript declarations, and generated declaration-only modules are not resolved; annotate those helpers directly with `HtmlBuilder` or `Block.ViewBuilderFor` when lint recognition is needed.

The `command-define-pascal-const` rule owns the complete Command declaration convention for both `Command.define` and Definition `command` calls: literal PascalCase identity, `const` binding, and an exact binding-name match. The older `command-binding-matches-name` configuration ID has been removed. Replace it with `foldkit/command-define-pascal-const` in explicit rule configurations. The same consolidated `no-direct-block-state-update` ID covers discarded Commands and OutMessages when a parent copies a child update or operation result's `model`; the older `require-fold-for-child-update-result` ID has also been removed.
