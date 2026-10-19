---
'foldkit': patch
---

Reject statically visible callbacks nested inside ViewInput records and collections when declaring a view. Keep callbacks at the top level, such as `toView: () => Html`; nested event handlers inside the returned Html remain supported. Runtime validation still protects dynamically typed input.

Application and Element assembly now contextually type an inline view's Model and builder while reporting that the view must first be authored through its Composition's `makeView`. Ownership, child and Mount registration checks still apply.

Malformed Steps supplied through unchecked JavaScript now report when a Step returns another Step instead of its result. Ordinary standalone Steps must return results; a Definition-owned Step may defer connected operations until its Composition executes them. Valid combined child and Command-producing initialization Steps retain their inferred requirements.

Clarify that `Update.combine` applies Steps sequentially to the Model, then returns their Commands as a batch. Command collection order does not sequence effect execution or completion.
