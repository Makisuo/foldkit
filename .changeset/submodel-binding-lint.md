---
'@foldkit/oxlint-plugin': minor
---

Recognize completed Block Bindings in the architecture rules. `no-direct-block-state-update` tracks a parent Model passed to a Binding’s `fold` or a Step composed through `Update.combine`. `require-fold-for-child-update-result` uses a Binding’s matching `read` and `write` to detect discarded child Commands and OutMessages. The Command naming and Mount element checks recognize named Block definition methods. Development guard checks recognize `ApplicationComposition.toApplication` and `ApplicationComposition.toElement`. OutMessage forwarding and Message wrapper checks recognize Binding configuration. Diagnostics point to registered Binding operations.

For wrapped keyed Bindings, `no-direct-block-state-update` rejects parent replacement of the nested child Model while allowing the parent to update wrapper metadata and collection membership.

Recognize root-owned Messages in Application completion callbacks and view helpers whose builder type comes from the owning Composition without permitting parents to manufacture foreign child Messages. Accept local Block, Query, and UI factory Message contracts in `Got*` wrappers.

Recognize a feature's own Messages imported from an early `definition.ts` inside owned authoring callbacks and completion configuration. Views and helpers can import their Composition or `ViewBuilder` from the implementation file named for the feature folder. This recognition follows local import paths and the documented file layout; foreign child aliases and parent-directory traversal retain their diagnostics.
