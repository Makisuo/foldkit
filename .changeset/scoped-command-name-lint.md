---
'@foldkit/oxlint-plugin': patch
---

Recognize qualified Command names produced by an owning Block in the Command declaration and binding-name rules. The local name still must be a PascalCase literal and match its definition binding.

Add `foldkit/block-name-matches-variable` to the recommended and all presets. Literal `Block.define` declarations, including chained registration, now require the declaration identifier and runtime Block name to match exactly.
