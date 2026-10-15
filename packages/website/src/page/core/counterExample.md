# A Simple Counter Example

## See the Whole Loop {#overview}

### Application Definitions

This counter puts the core loop from [Architecture](/core/architecture) into one small application. Its Model holds the count. Its Messages record button clicks. Its update function decides the next count, and its view renders the result.

The example uses two files. `src/application.ts` defines the typed `Application` with its Model and Message contracts, then authors init, update, and view through it. `src/application.ts` also creates the graphless Composition with `Application.toComposition()`. `src/entry.ts` imports it, selects the browser container, calls `toApplication`, and starts the Runtime. Importing the application pieces in a test does not start the browser application. Larger applications can split substantial logic into focused files.
::Snippet{name="counter" label="Counter Application"}

### Runtime Entry

The entry imports `ApplicationComposition` and the implementation pieces, then calls the Composition's owned `toApplication` method. The returned lowercase `application` is passive configuration. `Runtime.run` constructs its Layers and starts the application.
::Snippet{name="counterEntry" label="Counter entry.ts"}

### Where to Go Next

Read the example once for its shape. The next four pages examine the [Model](/core/model), [Messages](/core/messages), [update](/core/update), and [view](/core/view) in order. Later pages extend the same counter with a delayed reset, automatic counting, and saved state to introduce side effects and ongoing work.

Start with the Model, the single data structure that describes the application right now.
