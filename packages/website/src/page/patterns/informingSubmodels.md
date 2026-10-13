# Informing Blocks

## Parent-Owned Changes {#overview}

### Preserve Child Ownership

A Block sometimes needs to react to a change it does not own. The URL may change, a server may push new data, or a sibling field may establish a new constraint. The parent observes that change, but the child still owns the state transition it causes.

Expose an `inform*` Step from the completed child Block. The helper runs an internal child Message through update and returns the next child Model and Commands. The parent calls the projected `binding.inform*(...)`, so it never imports or constructs the internal Message.

### Choose Inform or Reflect

Use `inform*` when the child must derive a transition or return Commands. Use a silent [`reflect*` helper](/core/block#reflecting-external-state) when the child only needs to conform one of its values to an external source.

### Routing Example

The example below uses routing. A People Block owns its search input, results, and recent searches. The root owns the Route. When the URL resolves to a People Route, the root calls `people.informRouteChanged` through its registered binding.

:::Info{label="Prerequisite"}
This page builds on the [Blocks](/core/block) pattern. Read that first if the `Got*Message` wrapping convention is unfamiliar.
:::

## The Child

### Keep the Message Private

People declares an internal `ChangedRoute` Message carrying only `PeopleRoute`, the part of the application Route that the feature understands.

Update copies the route query into the input, records it in recent searches, and returns `FetchPeople` for the new results.

### Expose a Public Helper

`informRouteChanged` is a typed public operation authored with `people.step`. It calls `update(model, ChangedRoute({ route }))`, keeping the Message constructor private, and the completed Block registers it under `steps`.

::Snippet{name="informingBlocksChild" label="Child informRouteChanged helper"}

:::Warning{label="Not an OutMessage"}
`ChangedRoute` moves from parent to child through an `inform*` helper. An [OutMessage](/core/block#surfacing-facts) moves a fact from child to parent.
:::

## The Parent

### Define the Parent Folds

The People binding supplies one `read`, `write`, and `toParentMessage` boundary. Its `fold` handles regular People Messages, while `people.informRouteChanged` projects the public operation through the same boundary. The `ChangedUrl` handler stores the next Route, then composes the relevant child Step with `Update.combine`.

::Snippet{name="informingBlocksParent" label="Parent route fold"}

:::Info{label="Multiple Blocks"}
When several page Blocks react to routing, match the next Route and return the `informRouteChanged` step for the page that owns that Route.
:::

### Handle Cold Loads Separately

:::Warning{label="Cold loads"}
`informRouteChanged` handles later URL changes. On a cold load, root init parses the initial URL and passes the People Route to child init. See [Cold Loads and the Initial Route](/core/routing-and-navigation#cold-loads).
:::

### Reuse the Pattern for Other Causes

The [Routing example](/example-apps/routing) contains the complete search flow. [Routing and Navigation](/core/routing-and-navigation) covers the parser that produces these Routes.

The same pattern works when a [Subscription](/core/subscriptions) or [Command](/core/commands) tells the parent about a change the child must process. The cause changes, but ownership does not.
