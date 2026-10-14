---
'@foldkit/oxlint-plugin': patch
---

Recognize qualified Command names produced by an owning Block in the Command declaration and definition-name rules. The local name still must be a PascalCase literal and match its definition binding.

Add `foldkit/block-name-matches-variable` to the recommended and all presets. Literal `Block.define` declarations, including chained registration, now require the declaration identifier to use the `<BlockId>Definition` form. `const HomeDefinition = Block.define('Home', ...)` declares the Block ID `Home`.
