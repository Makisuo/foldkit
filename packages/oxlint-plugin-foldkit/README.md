# @foldkit/oxlint-plugin

Oxlint rules for Foldkit applications. Extend `recommended.json` for the full supported convention set, or `all.json` to enable every rule. Both presets enable `foldkit/block-name-matches-variable` at error severity.

`foldkit/block-name-matches-variable` requires a direct literal Block declaration to use the same identifier and runtime name:

```ts
const People = Block.define('People', { Model, Message })
```

The rule follows supported `foldkit` root and `foldkit/block` imports, including namespace and import aliases. Dynamic names are left for the developer to review.
