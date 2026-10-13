# Runtime

## Overview

A small Foldkit application can start in two files. `src/application.ts` exports the typed `Application`, Model and Message contracts, and implementation pieces. `src/entry.ts` chooses browser inputs, calls owned `Application.make` or `makeElement`, and starts the Runtime. Shared Service providers live in `services.ts` as `ApplicationLayer`. Importing application pieces in a test does not start the Runtime.

The Runtime API makes two independent choices:

- `Application.make` or `Application.makeElement` decides what the app owns. An application owns the page; an Element owns only its container.
- `Runtime.run` or `Runtime.embed` decides who owns the runtime lifetime. `run` starts it for the page lifetime; `embed` returns a handle the host disposes.

The defined Application carries the handler requirements for its Commands, Subscriptions, Mounts, and ManagedResources into `Application.make` or `Application.makeElement`. Call `provide` until their remaining service requirements are satisfied, then pass the runnable program to `Runtime.run`, `Runtime.hydrate`, or `Runtime.embed` as appropriate. The assembly config has no `resources` field; runtime-wide services are supplied through `provide`.

For a larger application, each completed child Block is bound and registered in its parent's `children`. This carries the handler and lifecycle graph to the Application without root-level handler lists. A feature may provide business services it owns while leaving HTTP, storage, RPC, and browser requirements open. The application root combines those external providers in `ApplicationLayer`; `Application.make({ init, update, view, ... })` already has the handlers. [Project Organization](/patterns/project-organization#composing-handler-layers) shows the complete file structure.

Create the typed definition with `define as defineApplication` from `foldkit/application`. Its completion methods capture the Model, Message, and registered graph; callers supply implementation pieces and host inputs. The returned lowercase `application` carries its unsatisfied requirements. Standalone `provide`, imported from the same subpath, supplies the ordinary Services it needs.

`provide` adds the supplied Layer recipe to the program. The Runtime builds that application Layer once for each start and releases its Scope when that start stops. Command lookup, Subscription restarts, Mount insertions, and ManagedResource reacquisitions reuse the resulting application-scoped handlers and providers.

::Snippet{name="runLayers" label="Providing application services"}

## Application.make {#make-application}

`Application.make` creates a Foldkit program for an app that owns the page. It supports both apps that leave the URL alone and apps that manage routing. The difference is whether you provide a `routing` config. To scope an app to one node without owning the page, use `Application.makeElement`.

### Without routing

Without a `routing` config, the program doesn't manage the URL bar.

::Snippet{name="runMakeApplication" label="Application without routing"}

### With routing

With a `routing` config, the program manages the URL bar. The init function receives the current URL and can use it to set the initial route.

::Snippet{name="runMakeApplicationRouting" label="Application with routing"}

The `routing` config has two handlers. `onUrlRequest` turns a clicked link into a Message, giving update the choice between internal and external navigation. `onUrlChange` turns the new URL into a Message so update can store the corresponding route in the Model. See [Routing & Navigation](/core/routing-and-navigation) for the full walkthrough.

The view returns a `Document` rather than bare HTML. A `Document` contains the body plus the document-level state that `Application.make` reapplies on every render. The tab title, the `<html>` language and direction, and the canonical and og\:url tags therefore stay in sync with the Model. [The Document](/core/view#the-document) lists every field.

## makeElement {#make-element}

### Page Ownership

`Application.make` assumes it owns the page. That is correct for an app that owns its tab, but not for a widget on a page controlled by another application, where document updates would overwrite the host page metadata.

Use `Application.makeElement` to scope a Foldkit app to its container. Its root view returns `Html` directly, and the runtime never touches the document `<head>` or the `<html>` element. The same Model, init, update, Command, Subscription, ManagedResource, and crash-handling architecture remains available. Element-scoped apps do not own the URL bar, so `Application.makeElement` has no `routing` config. Provide its remaining service requirements with `provide` before starting it.

### Flags

Flags still resolve before init, but their wiring follows the ownership boundary. A page-owning application receives its Flags Effect when `Runtime.run` starts it. A self-contained Element receives its Flags Effect in the `Application.makeElement` config, and that Effect's requirements join the Element's requirements.

::Snippet{name="runMakeElement" label="Using Application.makeElement"}

## embed

### Host-Owned Lifetime

`Runtime.run` starts a program for the lifetime of the page and returns no handle. `Runtime.embed` starts one under a host-controlled lifetime, whether the host is React or anything else. The host seeds the program with Flags, exchanges values through Schema-typed Ports, and tears it down with `dispose`.

### Handle Boundary

The returned handle is the whole boundary. The host never reads the Model or dispatches Messages directly. Disposing the handle stops the runtime and its lifecycle work, removes the rendered DOM, and restores the empty container so it can be embedded again.

Values produced from one program by `provide` share its container lifetime. Dispose the active handle before embedding another provided variant; Foldkit finishes the previous teardown before starting the next variant.

The [Embedding](/core/embedding) guide has the full walkthrough.
