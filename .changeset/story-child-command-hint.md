---
'foldkit': patch
---

Story and Scene errors for unresolved child Commands now point to lifecycle test helpers exposed by the completed component instance.

Command and Mount matchers now compare the original Definition's source identity instead of its displayed name. Definitions owned by different Blocks no longer collide when they share a local name, and placement-qualified child work still matches the original public Definition. An instance matcher also checks exact args, and a bound instance selects its composition path.

Resolve a child Command or Mount with its raw child result Message. Story and Scene replay the pending instance's generated delivery chain instead of requiring a test to construct a parent envelope.
