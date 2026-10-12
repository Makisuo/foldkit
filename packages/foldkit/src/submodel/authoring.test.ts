import { Context, Effect, Layer, Option, Schema } from 'effect'
import { describe, expect, expectTypeOf, it } from 'vitest'

import * as Command from '../command/index.js'
import { beginRender, createBoundaryRegistry } from '../html/boundary.js'
import { type HtmlBuilder, __htmlBuilder } from '../html/index.js'
import { clearRuntime, setRuntime } from '../html/runtimeSingleton.js'
import { submodel as renderSubmodel } from '../html/submodel.js'
import { defineMessageUnion } from '../message/index.js'
import * as Mount from '../mount/index.js'
import { Dispatch } from '../runtime/index.js'
import { modifyFields } from '../struct/index.js'
import type * as Update from '../update/index.js'
import { type Owner, owner } from './owner.js'
import type { OwnedName } from './ownerName.js'
import type { Composition } from './public.js'
import type {
  OperationRequirementsOfDescriptor,
  RequirementsOfDescriptor,
} from './requirements.js'

const HomeOwner = owner('Authoring/Home')

const HomeModel = Schema.Struct({
  status: Schema.Literals(['Idle', 'Creating']),
  joinedCount: Schema.Number,
})
type HomeModel = typeof HomeModel.Type

const HomeMessage = defineMessageUnion({
  ClickedCreateRoom: {},
  CompletedCreateRoom: { roomId: Schema.String },
})
type HomeMessage = typeof HomeMessage.Type

const HomeOutMessage = defineMessageUnion({
  CreatedRoom: { roomId: Schema.String },
})
type HomeOutMessage = typeof HomeOutMessage.Type

let createRoomHandlerBuilds = 0

const CreateRoom = Command.define(HomeOwner.name('CreateRoom'), {
  messages: [HomeMessage.CompletedCreateRoom],
  handler: function* () {
    createRoomHandlerBuilds += 1
    return () =>
      Effect.succeed(HomeMessage.CompletedCreateRoom({ roomId: 'room-1' }))
  },
})

const homeDefinition = HomeOwner.define({
  Model: HomeModel,
  Message: HomeMessage,
  OutMessage: HomeOutMessage,
})

const homeView = homeDefinition.defineView((model, h) =>
  h.button(
    [h.OnClick(HomeMessage.ClickedCreateRoom())],
    [`${model.status}:${model.joinedCount}`],
  ),
)

type HomeViewInputs = Readonly<{ label: string }>

let renderedHomeLabel = ''

const homeViewWithDefaultInputs =
  homeDefinition.defineView.withInputs<HomeViewInputs>(
    (_model, { label } = { label: 'Default' }, _h) => {
      renderedHomeLabel = label
      return null
    },
  )

const homeRestTupleView = homeDefinition.defineView.withInputs<HomeViewInputs>(
  (
    ...[_model, { label }, h]: [
      HomeModel,
      HomeViewInputs,
      HtmlBuilder<HomeMessage>,
    ]
  ) => h.div([], [label]),
)

const homeOptionalInputsView = homeDefinition.defineView.withInputs<
  HomeViewInputs | undefined
>((_model, inputs, h) => h.div([], [inputs?.label ?? 'Missing']))

let homeInitCalls = 0

const homeInit = () => {
  homeInitCalls += 1
  return {
    model: HomeModel.make({ status: 'Idle', joinedCount: 0 }),
  }
}

const homeUpdate = homeDefinition.defineUpdate((model, message) =>
  HomeMessage.match(message, {
    ClickedCreateRoom: () => ({
      model: modifyFields(model, { status: () => 'Creating' }),
      commands: [CreateRoom()],
    }),
    CompletedCreateRoom: ({ roomId }) => ({
      model: modifyFields(model, { status: () => 'Idle' }),
      outMessage: HomeOutMessage.CreatedRoom({ roomId }),
    }),
  }),
)

const homeBoot = homeDefinition.defineStep((model: HomeModel) => ({
  model,
  commands: [CreateRoom()],
}))

const homeInformJoined = homeDefinition.defineStep(
  (model: HomeModel, joinedCount: number) => ({
    model: modifyFields(model, { joinedCount: () => joinedCount }),
  }),
)

const Home = homeDefinition.compose({
  view: homeView,
  init: homeInit,
  update: homeUpdate,
  steps: {
    boot: homeBoot,
    informJoined: homeInformJoined,
  },
  EffectsLayer: CreateRoom.layer,
})

class SelectedRoomsClient extends Context.Service<
  SelectedRoomsClient,
  Readonly<{ roomId: string }>
>()('AuthoringSelectedRoomsClient') {}

const CreateRoomTestLayer = CreateRoom.toLayer(
  Effect.succeed(() =>
    Effect.succeed(HomeMessage.CompletedCreateRoom({ roomId: 'test-room' })),
  ),
)

const CreateRoomSelectedClientLayer = CreateRoom.toLayer(
  Effect.gen(function* () {
    const client = yield* SelectedRoomsClient
    return () =>
      Effect.succeed(HomeMessage.CompletedCreateRoom({ roomId: client.roomId }))
  }),
)

const CreateRoomFailedBuildLayer = CreateRoom.toLayer<
  never,
  'ProviderUnavailable'
>(Effect.fail<'ProviderUnavailable'>('ProviderUnavailable'))

const HomeWithTestProvider = Home.withEffectsLayer(CreateRoomTestLayer)
const HomeWithSelectedClient = Home.withEffectsLayer(
  CreateRoomSelectedClientLayer,
)
const HomeWithFailedBuild = Home.withEffectsLayer(CreateRoomFailedBuildLayer)

const homeComposition = {
  init: homeInit,
  update: homeUpdate,
  EffectsLayer: CreateRoomTestLayer,
} satisfies Composition<HomeModel, HomeMessage, HomeOutMessage>
const HomeWithCheckedComposition = homeDefinition.compose(homeComposition)

const RoomOwner = owner('Authoring/Room')

const RoomModel = Schema.Struct({
  roomId: Schema.String,
  joinedCount: Schema.Number,
})
type RoomModel = typeof RoomModel.Type

const RoomMessage = defineMessageUnion({
  ClickedRefreshRoom: {},
  CompletedLoadRoom: {},
})
type RoomMessage = typeof RoomMessage.Type

const LoadRoom = Command.define(RoomOwner.name('LoadRoom'), {
  args: { roomId: Schema.String },
  messages: [RoomMessage.CompletedLoadRoom],
})

const roomDefinition = RoomOwner.define({
  Model: RoomModel,
  Message: RoomMessage,
})

const roomUpdate = roomDefinition.defineUpdate(
  (model, message, source: 'Reconnect' | 'Route', retryCount?: number) =>
    RoomMessage.match(message, {
      ClickedRefreshRoom: () => ({
        model,
        commands: [LoadRoom({ roomId: model.roomId })],
      }),
      CompletedLoadRoom: () => ({
        model: modifyFields(model, {
          joinedCount: joinedCount =>
            joinedCount + (source === 'Reconnect' ? (retryCount ?? 1) : 1),
        }),
      }),
    }),
)

const roomInformJoined = roomDefinition.defineStep(
  (model, joinedCount: number, source?: 'Lobby' | 'Game') => ({
    model: modifyFields(model, {
      joinedCount: () => joinedCount + (source === 'Game' ? 1 : 0),
    }),
  }),
)

const Room = roomDefinition.compose({
  init: (roomId: string) => ({
    model: RoomModel.make({ roomId, joinedCount: 0 }),
  }),
  update: roomUpdate,
  steps: { informJoined: roomInformJoined },
  EffectsLayer: Layer.empty,
  hostHandlers: [LoadRoom],
})

const ChoiceOwner = owner('Authoring/Choice')

const CompletedObserveChoice = Schema.TaggedStruct('CompletedObserveChoice', {})

const ObserveChoice = Mount.define(ChoiceOwner.name('ObserveChoice'), {
  messages: [CompletedObserveChoice],
})

const ChoiceEffectsLayer = Layer.empty

const makeChoice = <Value extends string>(Value: Schema.Schema<Value>) => {
  const Model = Schema.Struct({ value: Value })
  type Model = typeof Model.Type
  const SelectedChoice = Schema.TaggedStruct('SelectedChoice', { value: Value })
  const Message = Schema.Union([SelectedChoice, CompletedObserveChoice])
  type Message = typeof Message.Type
  const OutMessage = Schema.TaggedStruct('SelectedChoice', { value: Value })

  const definition = ChoiceOwner.define({
    Model,
    Message,
    OutMessage,
    mounts: [ObserveChoice],
  })

  const view = definition.defineView.withInputs<Readonly<{ label: string }>>(
    (model, { label }, h) =>
      h.button(
        [
          h.OnMount(ObserveChoice()),
          h.OnClick(SelectedChoice.make({ value: model.value })),
        ],
        [label],
      ),
  )

  const update = definition.defineUpdate((model: Model, message: Message) => {
    if (message._tag === 'SelectedChoice') {
      return {
        model: Model.make({ value: message.value }),
        outMessage: OutMessage.make({ value: message.value }),
      }
    } else {
      return { model }
    }
  })

  const finish = definition.defineStep((_model: Model, value: Value) => ({
    model: Model.make({ value }),
    outMessage: OutMessage.make({ value }),
  }))

  return definition.compose({
    view,
    init: (value: Value) => ({ model: Model.make({ value }) }),
    update,
    steps: { finish },
    EffectsLayer: ChoiceEffectsLayer,
    hostHandlers: [ObserveChoice],
  })
}

const StringChoice = makeChoice(Schema.Literals(['One', 'Two']))

const LeafModel = Schema.Struct({ value: Schema.String })
type LeafModel = typeof LeafModel.Type

const LeafMessage = defineMessageUnion({
  UpdatedLeaf: { value: Schema.String },
})
type LeafMessage = typeof LeafMessage.Type

const makeLeaf = <const Namespace extends string>(
  LeafOwner: Owner<Namespace>,
  EffectsLayer: Layer.Layer<never, never, never>,
) => {
  const definition = LeafOwner.define({
    Model: LeafModel,
    Message: LeafMessage,
  })

  return definition.compose({
    init: () => ({ model: LeafModel.make({ value: '' }) }),
    update: (model: LeafModel, _message: LeafMessage) => ({ model }),
    EffectsLayer,
  })
}

const LeafParentModel = Schema.Struct({ leaf: LeafModel })
type LeafParentModel = typeof LeafParentModel.Type

const bindLeaf = <
  const Definition extends ReturnType<typeof makeLeaf>,
  const Placement extends string,
>(
  definition: Definition,
  placement: Placement,
) =>
  definition.bind({
    placement,
    read: (model: LeafParentModel) => Option.some(model.leaf),
    write: (model, leaf) => ({ ...model, leaf }),
    toParentMessage: (message: LeafMessage) => message,
  })

const GraphChildOwner = owner('Authoring/GraphChild')

const GraphChildModel = Schema.Struct({ count: Schema.Number })
type GraphChildModel = typeof GraphChildModel.Type

const GraphChildMessage = defineMessageUnion({
  RequestedChildWork: {},
  CompletedChildWork: {},
})
type GraphChildMessage = typeof GraphChildMessage.Type

const RunChildWork = Command.define(GraphChildOwner.name('RunChildWork'), {
  messages: [GraphChildMessage.CompletedChildWork],
  handler: function* () {
    return () => Effect.succeed(GraphChildMessage.CompletedChildWork())
  },
})

const graphChildDefinition = GraphChildOwner.define({
  Model: GraphChildModel,
  Message: GraphChildMessage,
})

const graphChildComposition = {
  init: () => ({ model: GraphChildModel.make({ count: 0 }) }),
  update: graphChildDefinition.defineUpdate((model, message) =>
    GraphChildMessage.match(message, {
      RequestedChildWork: () => ({ model, commands: [RunChildWork()] }),
      CompletedChildWork: () => ({ model }),
    }),
  ),
  EffectsLayer: RunChildWork.layer,
}

const GraphChild = graphChildDefinition.compose(graphChildComposition)

const GraphParentOwner = owner('Authoring/GraphParent')

const GraphParentModel = Schema.Struct({ child: GraphChildModel })
type GraphParentModel = typeof GraphParentModel.Type

const GraphParentMessage = defineMessageUnion({
  GotChildMessage: { message: GraphChildMessage },
  RequestedParentWork: {},
  CompletedParentWork: {},
})
type GraphParentMessage = typeof GraphParentMessage.Type

const RunParentWork = Command.define(GraphParentOwner.name('RunParentWork'), {
  messages: [GraphParentMessage.CompletedParentWork],
})

const graphChild = GraphChild.bind({
  placement: 'child',
  read: (model: GraphParentModel) => Option.some(model.child),
  write: (model, child) => ({ ...model, child }),
  toParentMessage: message => GraphParentMessage.GotChildMessage({ message }),
})

const graphParentDefinition = GraphParentOwner.define({
  Model: GraphParentModel,
  Message: GraphParentMessage,
  children: [graphChild],
})

const graphParentComposition = {
  init: () => ({
    model: GraphParentModel.make({
      child: GraphChildModel.make({ count: 0 }),
    }),
  }),
  update: (model: GraphParentModel, _message: GraphParentMessage) => ({
    model,
  }),
  EffectsLayer: Layer.empty,
}

const GraphParent = graphParentDefinition.compose(graphParentComposition)

const SelectedGraphChild = GraphChild.withEffectsLayer(
  RunChildWork.toLayer<never, 'ChildProviderUnavailable', SelectedRoomsClient>(
    Effect.gen(function* () {
      yield* SelectedRoomsClient
      return yield* Effect.fail<'ChildProviderUnavailable'>(
        'ChildProviderUnavailable',
      )
    }),
  ),
)
const selectedGraphChild = SelectedGraphChild.bind({
  placement: 'selected-child',
  read: (model: GraphParentModel) => Option.some(model.child),
  write: (model, child) => ({ ...model, child }),
  toParentMessage: message => GraphParentMessage.GotChildMessage({ message }),
})
const SelectedGraphParent = owner('Authoring/SelectedGraphParent')
  .define({
    Model: GraphParentModel,
    Message: GraphParentMessage,
    children: [selectedGraphChild],
  })
  .compose(graphParentComposition)
  .withEffectsLayer(Layer.empty)

const SelectedGraphParentWithFailure = SelectedGraphParent.withEffectsLayer(
  Layer.effectDiscard(
    Effect.fail<'ParentProviderUnavailable'>('ParentProviderUnavailable'),
  ),
)

const PolicyParentOwner = owner('Authoring/PolicyParent')

const PolicyParentModel = Schema.Struct({ choice: StringChoice.Model })
type PolicyParentModel = typeof PolicyParentModel.Type

const choiceWithPolicyCommand = StringChoice.bind({
  placement: 'choice',
  read: (model: PolicyParentModel) => Option.some(model.choice),
  write: (model, choice) => ({ ...model, choice }),
  toParentMessage: () => HomeMessage.ClickedCreateRoom(),
  outMessage: {
    fold: () => model => ({ model, commands: [CreateRoom()] }),
  },
})

const policyParentDefinition = PolicyParentOwner.define({
  Model: PolicyParentModel,
  Message: HomeMessage,
  children: [choiceWithPolicyCommand],
})

const PolicyParent = policyParentDefinition.compose({
  init: () => ({
    model: PolicyParentModel.make({
      choice: StringChoice.Model.make({ value: 'One' }),
    }),
  }),
  update: (model: PolicyParentModel, _message: HomeMessage) => ({ model }),
  EffectsLayer: Layer.empty,
  hostHandlers: [ObserveChoice, CreateRoom],
})

if (false) {
  const erasedComposition: Composition<HomeModel, HomeMessage, HomeOutMessage> =
    homeComposition
  // @ts-expect-error A broad annotation erases operation and provider requirements.
  homeDefinition.compose(erasedComposition)

  // @ts-expect-error Selecting a recipe still requires every local handler.
  Home.withEffectsLayer(Layer.empty)

  const erasedInputs: Layer.Layer<
    Command.HandlerOf<typeof CreateRoom>,
    never,
    any
  > = CreateRoomTestLayer
  // oxlint-disable effecttsgo/any-unknown-in-error-context
  // @ts-expect-error A selected recipe must preserve exact construction inputs.
  Home.withEffectsLayer(erasedInputs)
  // oxlint-enable effecttsgo/any-unknown-in-error-context

  const erasedOutputs: Layer.Layer<any> = CreateRoomTestLayer
  // @ts-expect-error A selected recipe must preserve exact handler outputs.
  Home.withEffectsLayer(erasedOutputs)

  const ConflictingCreateRoom = Command.define(HomeOwner.name('CreateRoom'), {
    args: { foreignId: Schema.String },
    messages: [HomeMessage.CompletedCreateRoom],
    handler: function* () {
      return () =>
        Effect.succeed(HomeMessage.CompletedCreateRoom({ roomId: 'foreign' }))
    },
  })
  Home.withEffectsLayer(
    // @ts-expect-error Same-name selected handlers must preserve the exact original contract.
    Layer.merge(CreateRoomTestLayer, ConflictingCreateRoom.layer),
  )

  Room.withEffectsLayer(
    // @ts-expect-error Selection retains the exact residual host contract.
    LoadRoom.toLayer(
      Effect.succeed(() => Effect.succeed(RoomMessage.CompletedLoadRoom())),
    ),
  )

  // @ts-expect-error Owner namespaces cannot be empty.
  owner('')
  // @ts-expect-error Owner namespaces cannot contain empty segments.
  owner('Authoring//Invalid')
  // @ts-expect-error Local definition names cannot introduce another namespace.
  HomeOwner.name('Nested/CreateRoom')

  homeDefinition.defineView(
    // @ts-expect-error Views use the Model fixed by owner.define.
    (_model: Readonly<{ foreign: true }>, h) => h.div([]),
  )

  homeDefinition.defineView((_model, h) =>
    h.div([
      // @ts-expect-error The view may use only Mounts registered by its definition or children.
      h.OnMount(ObserveChoice()),
    ]),
  )

  // @ts-expect-error void would collapse the three-argument view to two arguments.
  homeDefinition.defineView.withInputs<void>((_model, _inputs, h) => h.div([]))
  // @ts-expect-error undefined would collapse the three-argument view to two arguments.
  homeDefinition.defineView.withInputs<undefined>((_model, _inputs, h) =>
    h.div([]),
  )
  // @ts-expect-error never cannot describe a usable viewInputs value.
  homeDefinition.defineView.withInputs<never>((_model, _inputs, h) => h.div([]))
  // @ts-expect-error any would erase the viewInputs contract.
  homeDefinition.defineView.withInputs<any>((_model, _inputs, h) => h.div([]))

  homeDefinition.defineUpdate(
    // @ts-expect-error Updates use the Model fixed by owner.define.
    (model: RoomModel, _message: HomeMessage) => ({ model }),
  )

  roomDefinition.defineUpdate((model, _message) => ({
    model,
    // @ts-expect-error A Submodel without OutMessage cannot emit one.
    outMessage: HomeOutMessage.CreatedRoom({ roomId: model.roomId }),
  }))

  homeDefinition.defineUpdate((model, _message, context) => {
    // @ts-expect-error Extra update context requires an explicit type annotation.
    context.nonexistent
    return { model }
  })

  homeDefinition.defineStep((model, input) => {
    // @ts-expect-error Extra Step input requires an explicit type annotation.
    input.nonexistent
    return { model }
  })

  // @ts-expect-error Inline unknown context cannot form a precise producer contract.
  roomDefinition.compose({
    init: flags => {
      // @ts-expect-error Inline init parameters require explicit annotations.
      flags.nonexistent
      return { model: RoomModel.make({ roomId: '', joinedCount: 0 }) }
    },
    update: (model, _message, context) => {
      // @ts-expect-error Inline update context requires an explicit annotation.
      context.nonexistent
      return { model }
    },
    steps: {
      inspect: (model, input) => {
        // @ts-expect-error Inline Step inputs require explicit annotations.
        input.nonexistent
        return { model }
      },
    },
    EffectsLayer: Layer.empty,
  })

  // @ts-expect-error Explicit any context erases the operation contract.
  homeDefinition.defineStep((model, _input: any) => ({ model }))

  // @ts-expect-error Explicit any context erases the operation contract.
  homeDefinition.defineUpdate((model, _message, _context: any) => ({ model }))

  // @ts-expect-error A parent operation remains uncovered by a child-provided Layer.
  graphParentDefinition.compose({
    init: GraphParent.init,
    update: (model: GraphParentModel) => ({
      model,
      commands: [RunParentWork()],
    }),
    EffectsLayer: Layer.empty,
  })

  // @ts-expect-error A child named Step's OutMessage policy Command requires its handler.
  policyParentDefinition.compose({
    init: PolicyParent.init,
    update: PolicyParent.update,
    EffectsLayer: Layer.empty,
    hostHandlers: [ObserveChoice],
  })

  // @ts-expect-error Child bindings must use the definition's parent Model.
  GraphParentOwner.define({
    Model: HomeModel,
    Message: GraphParentMessage,
    children: [graphChild],
  })

  const childWithForeignCommandMessage = StringChoice.bind({
    placement: 'foreign-command-message',
    read: (_model: GraphParentModel) =>
      Option.some(StringChoice.Model.make({ value: 'One' })),
    write: model => model,
    toParentMessage: () => GraphParentMessage.CompletedParentWork(),
    outMessage: {
      fold: () => model => ({ model, commands: [CreateRoom()] }),
    },
  })
  // @ts-expect-error Child policy Commands must produce the definition's Message.
  GraphParentOwner.define({
    Model: GraphParentModel,
    Message: GraphParentMessage,
    children: [childWithForeignCommandMessage],
  })

  const ParentOutMessage = defineMessageUnion({ AcceptedChildResult: {} })
  const childWithForeignForward = StringChoice.bind({
    placement: 'foreign-forward',
    read: (_model: GraphParentModel) =>
      Option.some(StringChoice.Model.make({ value: 'One' })),
    write: model => model,
    toParentMessage: () => GraphParentMessage.CompletedParentWork(),
    outMessage: {
      forward: () => HomeOutMessage.CreatedRoom({ roomId: 'foreign' }),
    },
  })
  GraphParentOwner.define({
    Model: GraphParentModel,
    Message: GraphParentMessage,
    // @ts-expect-error Forwarded child OutMessages must belong to the parent OutMessage.
    OutMessage: ParentOutMessage,
    children: [childWithForeignForward],
  })
  // @ts-expect-error A parent without OutMessage cannot forward a child OutMessage.
  GraphParentOwner.define({
    Model: GraphParentModel,
    Message: GraphParentMessage,
    children: [childWithForeignForward],
  })

  const childWithForeignDerivedOutMessage = StringChoice.bind({
    placement: 'foreign-derived-out-message',
    read: (_model: GraphParentModel) =>
      Option.some(StringChoice.Model.make({ value: 'One' })),
    write: model => model,
    toParentMessage: () => GraphParentMessage.CompletedParentWork(),
    outMessage: {
      fold: () => model => ({
        model,
        outMessage: HomeOutMessage.CreatedRoom({ roomId: 'foreign' }),
      }),
    },
  })
  GraphParentOwner.define({
    Model: GraphParentModel,
    Message: GraphParentMessage,
    // @ts-expect-error Derived child OutMessages must belong to the parent OutMessage.
    OutMessage: ParentOutMessage,
    children: [childWithForeignDerivedOutMessage],
  })
}

describe('Submodel authoring', () => {
  it('preserves exact selected Layer channels without changing operation contracts', () => {
    expectTypeOf<
      RequirementsOfDescriptor<typeof HomeWithTestProvider>
    >().toEqualTypeOf<never>()
    expectTypeOf<
      RequirementsOfDescriptor<typeof HomeWithSelectedClient>
    >().toEqualTypeOf<SelectedRoomsClient>()
    expectTypeOf<
      OperationRequirementsOfDescriptor<typeof HomeWithSelectedClient>
    >().toEqualTypeOf<Command.HandlerOf<typeof CreateRoom>>()
    expectTypeOf<
      Layer.Success<typeof HomeWithSelectedClient.EffectsLayer>
    >().toEqualTypeOf<Command.HandlerOf<typeof CreateRoom>>()
    expectTypeOf<
      Layer.Services<typeof HomeWithSelectedClient.EffectsLayer>
    >().toEqualTypeOf<SelectedRoomsClient>()
    expectTypeOf<
      Layer.Error<typeof HomeWithFailedBuild.EffectsLayer>
    >().toEqualTypeOf<'ProviderUnavailable'>()
    expectTypeOf<
      RequirementsOfDescriptor<typeof SelectedGraphParent>
    >().toEqualTypeOf<SelectedRoomsClient>()
    expectTypeOf<
      Layer.Success<typeof SelectedGraphParent.EffectsLayer>
    >().toEqualTypeOf<Command.HandlerOf<typeof RunChildWork>>()
    expectTypeOf<
      OperationRequirementsOfDescriptor<typeof SelectedGraphParent>
    >().toEqualTypeOf<Command.HandlerOf<typeof RunChildWork>>()
    expectTypeOf<
      Layer.Error<typeof SelectedGraphParentWithFailure.EffectsLayer>
    >().toEqualTypeOf<
      'ChildProviderUnavailable' | 'ParentProviderUnavailable'
    >()
    expectTypeOf<
      Layer.Services<typeof SelectedGraphParentWithFailure.EffectsLayer>
    >().toEqualTypeOf<SelectedRoomsClient>()
    expectTypeOf(HomeWithTestProvider.update).toEqualTypeOf(Home.update)
    expectTypeOf(HomeWithTestProvider.init).toEqualTypeOf(Home.init)
    expectTypeOf(HomeWithTestProvider.steps).toEqualTypeOf(Home.steps)
    expectTypeOf<
      RequirementsOfDescriptor<typeof HomeWithCheckedComposition>
    >().toEqualTypeOf<never>()
    expectTypeOf(Room.withEffectsLayer(Layer.empty).update).toEqualTypeOf(
      Room.update,
    )
    expectTypeOf(
      StringChoice.withEffectsLayer(Layer.empty).steps.finish,
    ).toEqualTypeOf(StringChoice.steps.finish)

    expect(HomeWithTestProvider.owner).toBe(Home.owner)
    expect(HomeWithTestProvider.Model).toBe(Home.Model)
    expect(HomeWithTestProvider.Message).toBe(Home.Message)
    expect(HomeWithTestProvider.OutMessage).toBe(Home.OutMessage)
    expect(HomeWithTestProvider.view).toBe(Home.view)
    expect(HomeWithTestProvider.init).toBe(Home.init)
    expect(HomeWithTestProvider.update).toBe(Home.update)
    expect(HomeWithTestProvider.steps).toBe(Home.steps)
    expect(HomeWithTestProvider.children).toBe(Home.children)
    expect(HomeWithTestProvider.hostHandlers).toEqual(Home.hostHandlers)
    expect(HomeWithTestProvider.EffectsLayer).toBe(CreateRoomTestLayer)
  })

  it('runs Commands through the selected handler definition', async () => {
    const message = await Effect.runPromise(
      Effect.provide(CreateRoom().effect, HomeWithTestProvider.EffectsLayer),
    )

    expect(message).toEqual(
      HomeMessage.CompletedCreateRoom({ roomId: 'test-room' }),
    )
    expect(createRoomHandlerBuilds).toBe(0)
  })

  it('selects a local recipe passively and preserves selected child constructors', async () => {
    const ParentOwner = owner('Authoring/SelectedRecipe')
    const ChildOwner = owner('Authoring/SelectedRecipeChild')
    let defaultParentBuilds = 0
    let selectedParentBuilds = 0
    let defaultChildBuilds = 0
    let selectedChildBuilds = 0

    class DefaultProviderClient extends Context.Service<
      DefaultProviderClient,
      Readonly<{ name: string }>
    >()('AuthoringDefaultProviderClient') {}

    const DefaultParentLayer = Layer.suspend(() => {
      defaultParentBuilds += 1
      return Layer.effectDiscard(DefaultProviderClient)
    })
    const SelectedParentLayer = Layer.suspend(() => {
      selectedParentBuilds += 1
      return Layer.empty
    })
    const DefaultChildLayer = Layer.suspend(() => {
      defaultChildBuilds += 1
      return Layer.empty
    })
    const SelectedChildLayer = Layer.suspend(() => {
      selectedChildBuilds += 1
      return Layer.empty
    })

    const child = bindLeaf(
      makeLeaf(ChildOwner, DefaultChildLayer).withEffectsLayer(
        SelectedChildLayer,
      ),
      'child',
    )
    const definition = ParentOwner.define({
      Model: LeafParentModel,
      Message: LeafMessage,
      children: [child],
    })
    const descriptor = definition.compose({
      init: () => ({
        model: LeafParentModel.make({ leaf: LeafModel.make({ value: '' }) }),
      }),
      update: (model: LeafParentModel, _message: LeafMessage) => ({ model }),
      EffectsLayer: DefaultParentLayer,
    })
    const withEffectsLayer = descriptor.withEffectsLayer
    const selected = withEffectsLayer(SelectedParentLayer)

    expectTypeOf<
      RequirementsOfDescriptor<typeof descriptor>
    >().toEqualTypeOf<DefaultProviderClient>()
    expectTypeOf<
      RequirementsOfDescriptor<typeof selected>
    >().toEqualTypeOf<never>()

    expect(defaultParentBuilds).toBe(0)
    expect(selectedParentBuilds).toBe(0)
    expect(defaultChildBuilds).toBe(0)
    expect(selectedChildBuilds).toBe(0)
    expect(selected.children).toBe(descriptor.children)

    await Effect.runPromise(Effect.scoped(Layer.build(selected.EffectsLayer)))

    expect(defaultParentBuilds).toBe(0)
    expect(selectedParentBuilds).toBe(1)
    expect(defaultChildBuilds).toBe(0)
    expect(selectedChildBuilds).toBe(1)
  })

  it('rejects simultaneous default and selected recipes for the same Owner', () => {
    const RepeatedOwner = owner('Authoring/SelectedConflict')
    const descriptor = makeLeaf(RepeatedOwner, Layer.empty)
    const selected = descriptor.withEffectsLayer(
      Layer.suspend(() => Layer.empty),
    )
    const ParentOwner = owner('Authoring/SelectedConflictParent')

    expect(() =>
      ParentOwner.define({
        Model: LeafParentModel,
        Message: LeafMessage,
        children: [
          bindLeaf(descriptor, 'default'),
          bindLeaf(selected, 'selected'),
        ],
      }),
    ).toThrow(/uses different EffectsLayer recipes/)
  })

  it('qualifies primitive names with the Owner namespace', () => {
    expect(HomeOwner.name('CreateRoom')).toBe('Authoring/Home/CreateRoom')
    expectTypeOf(HomeOwner.name('CreateRoom')).toEqualTypeOf<
      OwnedName<'Authoring/Home', 'CreateRoom'>
    >()
  })

  it('rejects invalid dynamic namespace and local name values', () => {
    expect(() => owner(globalThis.String('Authoring//Invalid'))).toThrow(
      /namespace must contain non-empty path segments/,
    )
    expect(() =>
      HomeOwner.name(globalThis.String('Nested/CreateRoom')),
    ).toThrow(/local name must be non-empty/)
  })

  it('constructs a passive descriptor with named public Steps', () => {
    expect(homeInitCalls).toBe(0)
    expect(createRoomHandlerBuilds).toBe(0)
    expect(Home.owner).toBe(HomeOwner)
    expect(Home.view).toBe(homeView)
    expect(Home.steps).toEqual({
      boot: homeBoot,
      informJoined: homeInformJoined,
    })
    expect(typeof Home.bind).toBe('function')

    const homeInit_ = Home.init()

    expect(homeInit_.model).toEqual({ status: 'Idle', joinedCount: 0 })
    expect(homeInitCalls).toBe(1)
  })

  it('preserves update requirements, OutMessages, and contextual Step inputs', () => {
    const model = HomeModel.make({ status: 'Idle', joinedCount: 0 })
    const startedCreate = Home.update(model, HomeMessage.ClickedCreateRoom())
    const informedJoined = Home.steps.informJoined(model, 3)

    expect(startedCreate.model.status).toBe('Creating')
    expect(startedCreate.commands?.map(command => command.name)).toEqual([
      'Authoring/Home/CreateRoom',
    ])
    expect(informedJoined.model.joinedCount).toBe(3)

    expectTypeOf(Home.update).toEqualTypeOf<
      (
        model: HomeModel,
        message: HomeMessage,
      ) => Update.ReturnWithOutMessage<
        HomeModel,
        HomeMessage,
        HomeOutMessage,
        Command.HandlerOf<typeof CreateRoom>
      >
    >()
  })

  it('keeps required and optional context on host-backed Room operations', () => {
    expect(Room.hostHandlers).toEqual([LoadRoom])
    expectTypeOf(Room.update).toEqualTypeOf<
      (
        model: RoomModel,
        message: RoomMessage,
        source: 'Reconnect' | 'Route',
        retryCount?: number,
      ) => Update.Return<
        RoomModel,
        RoomMessage,
        Command.HandlerOf<typeof LoadRoom>
      >
    >()
    expectTypeOf(Room.steps.informJoined).toEqualTypeOf<
      (
        model: RoomModel,
        joinedCount: number,
        source?: 'Lobby' | 'Game',
      ) => Update.Return<RoomModel, RoomMessage>
    >()
  })

  it('retains generic Model and OutMessage payloads with Mount capabilities', () => {
    expect(StringChoice.mounts).toEqual([ObserveChoice])
    expect(StringChoice.hostHandlers).toEqual([ObserveChoice])
    expectTypeOf<typeof StringChoice.Model.Type>().toEqualTypeOf<
      Readonly<{ value: 'One' | 'Two' }>
    >()
    expectTypeOf<typeof StringChoice.OutMessage.Type>().toEqualTypeOf<
      Readonly<{ _tag: 'SelectedChoice'; value: 'One' | 'Two' }>
    >()
    expectTypeOf(StringChoice.steps.finish).toEqualTypeOf<
      (
        model: typeof StringChoice.Model.Type,
        value: 'One' | 'Two',
      ) => Update.ReturnWithOutMessage<
        typeof StringChoice.Model.Type,
        typeof StringChoice.Message.Type,
        typeof StringChoice.OutMessage.Type
      >
    >()
  })

  it('dispatches explicit viewInputs independently of callback arity', () => {
    const registry = createBoundaryRegistry()
    const dispatchSync = (_message: unknown): void => {}
    const dispatchService = Dispatch.of({
      dispatchAsync: () =>
        /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
        Promise.resolve() as unknown as ReturnType<
          typeof Dispatch.Service.dispatchAsync
        >,
      dispatchSync,
    })
    const context = Context.make(Dispatch, dispatchService).pipe(
      Context.add(Mount.MountTracker, {
        started: () => {},
        ended: () => {},
      }),
    )
    setRuntime(dispatchSync, context, registry)
    beginRender(registry)

    try {
      renderSubmodel(
        {
          slotId: 'default-inputs',
          model: HomeModel.make({ status: 'Idle', joinedCount: 0 }),
          view: homeViewWithDefaultInputs,
          viewInputs: { label: 'Explicit' },
          toParentMessage: message => message,
        },
        __htmlBuilder(),
      )
      renderSubmodel(
        {
          slotId: 'rest-inputs',
          model: HomeModel.make({ status: 'Idle', joinedCount: 0 }),
          view: homeRestTupleView,
          viewInputs: { label: 'Rest' },
          toParentMessage: message => message,
        },
        __htmlBuilder(),
      )
    } finally {
      clearRuntime()
    }

    expect(homeViewWithDefaultInputs.length).toBe(1)
    expect(homeRestTupleView.length).toBe(0)
    expect(renderedHomeLabel).toBe('Explicit')
    expectTypeOf(homeOptionalInputsView).parameters.toEqualTypeOf<
      [HomeModel, HomeViewInputs | undefined, HtmlBuilder<HomeMessage>]
    >()
  })

  it('rejects distinct Owner identities with the same namespace', () => {
    const FirstOwner = owner('Authoring/Collision')
    const SecondOwner = owner('Authoring/Collision')
    const first = bindLeaf(makeLeaf(FirstOwner, Layer.empty), 'first')
    const second = bindLeaf(makeLeaf(SecondOwner, Layer.empty), 'second')
    const ParentOwner = owner('Authoring/CollisionParent')

    expect(() =>
      ParentOwner.define({
        Model: LeafParentModel,
        Message: LeafMessage,
        children: [first, second],
      }),
    ).toThrow(
      /owner namespace "Authoring\/Collision" was created more than once/,
    )
  })

  it('rejects different provider recipes for repeated placements', () => {
    const RepeatedOwner = owner('Authoring/Repeated')
    const first = bindLeaf(
      makeLeaf(
        RepeatedOwner,
        Layer.suspend(() => Layer.empty),
      ),
      'first',
    )
    const second = bindLeaf(
      makeLeaf(
        RepeatedOwner,
        Layer.suspend(() => Layer.empty),
      ),
      'second',
    )
    const ParentOwner = owner('Authoring/RepeatedParent')

    expect(() =>
      ParentOwner.define({
        Model: LeafParentModel,
        Message: LeafMessage,
        children: [first, second],
      }),
    ).toThrow(/uses different EffectsLayer recipes/)
  })

  it('allows one descriptor at multiple placements with one provider recipe', () => {
    const RepeatedOwner = owner('Authoring/Shared')
    const Shared = makeLeaf(
      RepeatedOwner,
      Layer.suspend(() => Layer.empty),
    )
    const first = bindLeaf(Shared, 'first')
    const second = bindLeaf(Shared, 'second')
    const ParentOwner = owner('Authoring/SharedParent')

    expect(() =>
      ParentOwner.define({
        Model: LeafParentModel,
        Message: LeafMessage,
        children: [first, second],
      }),
    ).not.toThrow()
  })

  it('allows Owner refinements that select the same provider recipe', () => {
    const RefinedOwner = owner('Authoring/Refined')
    const EffectsLayer = Layer.suspend(() => Layer.empty)
    const first = bindLeaf(makeLeaf(RefinedOwner, EffectsLayer), 'first')
    const second = bindLeaf(makeLeaf(RefinedOwner, EffectsLayer), 'second')
    const ParentOwner = owner('Authoring/RefinedParent')

    expect(() =>
      ParentOwner.define({
        Model: LeafParentModel,
        Message: LeafMessage,
        children: [first, second],
      }),
    ).not.toThrow()
  })

  it('credits a bound child Layer in the selected parent graph', () => {
    expect(GraphParent.children).toEqual([graphChild])
    expect(GraphParent.EffectsLayer).not.toBe(Layer.empty)
    expectTypeOf<
      RequirementsOfDescriptor<typeof GraphParent>
    >().toEqualTypeOf<never>()
  })

  it('keeps policy Command requirements from a bound child named Step', () => {
    expect(PolicyParent.children).toEqual([choiceWithPolicyCommand])
    expect(PolicyParent.hostHandlers).toEqual([ObserveChoice, CreateRoom])
  })
})
