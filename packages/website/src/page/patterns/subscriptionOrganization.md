# Subscription Organization

## Overview

A Block owns the Subscriptions that produce its Messages. Its completed descriptor carries those registrations and their handler recipes. A parent connection lifts them through the same Model accessor and Message wrapper used for update and view.

This keeps one parent-child relationship in one place. The parent does not separately lift and aggregate a child's Subscription record, and the application entry does not import leaf Subscription handlers.

## Declare Local Subscriptions

Use the Block definition's `subscriptions` helper. It fixes the Model and Message types while each entry keeps its named handler identity, dependency Schema, declared Messages, and attached Layer recipe.

::Snippet{name="subscriptionOrganizationChild" label="Block Subscription definitions"}

Compose the attached entry recipes in the feature's local `EffectsLayer`. Pass that bundle to `definition.assemble`. A parent connection contributes it automatically.

## Connect the Child Once

The parent connects the completed child and registers the connection in its own definition:

::Snippet{name="subscriptionOrganizationComposing" label="Registering child Subscriptions through a connection"}

The connection derives three things from the same policy:

- `read` locates the child Model for update and every lifecycle.
- `parentMessage` wraps update, Command, Subscription, Mount, and ManagedResource Messages.
- `placement` qualifies the child's runtime identities and registration keys.

Nested Blocks repeat the same pattern. By the time a Stream reaches the root, every emitted Message has been wrapped through each parent boundary.

## Install the Root

The typed Application or its registered composition already contains the Subscription and handler graph. Its owned `make` method completes the browser program with the implementation:

::Snippet{name="subscriptionOrganizationRoot" label="Installing the root Subscription graph"}

The root `ApplicationLayer` supplies ordinary services required by the handlers. It does not merge the feature `EffectsLayer` bundles again.

## Optional Children

Return `Some(child)` from `read` while the child exists and `None` while it is absent. Foldkit stops every Stream for the absent occurrence and skips its dependency functions.

::Snippet{name="subscriptionOrganizationOptional" label="Reading an optional child Model"}

When that child reappears, its Streams start in a new occurrence scope.

## Parent-owned Gates {#gating}

A child expresses conditions from its own Model through `modelToDependencies` and its Stream. It cannot see parent-owned state such as the active Route. Put that policy on the connection.

### Gate the whole child record

::Snippet{name="subscriptionOrganizationGate" label="Route-gated child Subscriptions"}

The gate controls Stream lifetime only. It does not make the child Model absent and does not prevent `connection.fold` from running.

### Gate named entries

Use a record when some entries remain active. This Room keeps its connection Stream alive while gating only its keyboard listener:

::Snippet{name="subscriptionOrganizationEntryGate" label="Per-entry Subscription gate"}

An omitted entry has no additional parent gate. It still stops when `read` returns `None`.

## Keyed Children

Use `child.keyedConnection` for a collection. The connection declares `readAll`, the stable `key`, and parent routing once. Every active key receives independent Stream scopes and its own gate evaluation.

Removing a key stops those Streams. Reusing the key later creates a fresh occurrence, so callbacks captured by the old occurrence cannot dispatch into the replacement.

## Ownership Rule

Put a Subscription in the lowest Block whose Messages it emits and whose Model controls its dependencies. Parent route policy belongs on the connection. Shared event-source services belong in Effect Layers supplied at application assembly.
