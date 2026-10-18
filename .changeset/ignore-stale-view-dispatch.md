---
'foldkit': patch
---

Ignore DOM events fired by a removed Block view after focus cleanup while keeping events from the active view instance routed through its current Message boundary. Retired view dispatchers no longer remain strongly cached by an active Model occurrence across repeated remounts.
