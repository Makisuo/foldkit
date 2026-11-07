---
'foldkit': minor
---

Add `renderTarget` to `makeApplication` and `makeElement` as the alternative to `container`. A `RenderTarget` receives each rendered Document and owns the frame clock, while the runtime keeps update, Commands, Subscriptions, ManagedResources, Ports, and routing. This lets a Foldkit app render outside the DOM, for example to a native renderer, with no `window` or `document` touched on the render path.
