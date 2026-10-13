---
'@foldkit/oxlint-plugin': minor
---

Recognize completed Block bindings in the architecture rules. `no-direct-block-state-update` tracks a parent Model passed to a binding’s `fold` or a Step composed through `Update.combine`. `require-fold-for-child-update-result` uses a binding’s matching `read` and `write` to detect discarded child Commands and OutMessages. The Command naming and Mount element checks recognize named Block definition methods. Development guard checks recognize `Application.make` and `Application.makeElement`. OutMessage forwarding and Message wrapper checks recognize binding configuration. Diagnostics point to registered binding operations.

Recognize root-owned Messages in Application completion callbacks and owned view helpers without permitting parents to manufacture foreign child Messages. Accept local Block, Query, and UI factory Message contracts in `Got*` wrappers.
