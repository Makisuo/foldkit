import { Context, Effect, Layer, Option, Schema } from 'effect'
import {
  Block,
  Message,
  Route,
  Struct,
  Update,
  defineApplication,
} from 'foldkit'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? (<Value>() => Value extends Right ? 1 : 2) extends <
        Value,
      >() => Value extends Left ? 1 : 2
      ? true
      : false
    : false
type Expect<Value extends true> = Value
type ReturnOutMessage<Output> = Output extends unknown
  ? 'outMessage' extends keyof Output
    ? Output extends Readonly<{ outMessage?: infer OutMessage }>
      ? Exclude<OutMessage, undefined>
      : never
    : never
  : never

export class DraftStore extends Context.Service<
  DraftStore,
  Readonly<{ clear: Effect.Effect<void> }>
>()('DeclarationReciprocalDraftStore') {}

export const HomeModel = Schema.Struct({
  username: Schema.String,
  resetCount: Schema.Number,
})
export const HomeMessage = Message.defineMessageUnion({
  SucceededJoinRoom: { roomId: Schema.String, username: Schema.String },
  CompletedClearJoinDraft: {},
})
export const HomeOutMessage = Message.defineMessageUnion({
  JoinedRoom: { roomId: Schema.String, username: Schema.String },
})
const DeclarationReciprocalHome = Block.define('DeclarationReciprocalHome', {
  Model: HomeModel,
  Message: HomeMessage,
  OutMessage: HomeOutMessage,
})
export const ClearJoinDraft = DeclarationReciprocalHome.command(
  'ClearJoinDraft',
  {
    messages: [HomeMessage.CompletedClearJoinDraft],
    handler: function* () {
      const store = yield* DraftStore
      return () =>
        store.clear.pipe(Effect.as(HomeMessage.CompletedClearJoinDraft()))
    },
  },
)
const DeclarationReciprocalHomeComposition =
  DeclarationReciprocalHome.toComposition()
const resetJoinForm = DeclarationReciprocalHome.step(
  (model, username: string) => ({
    model: Struct.modifyFields(model, {
      username: () => username,
      resetCount: count => count + 1,
    }),
    commands: [ClearJoinDraft()],
  }),
)
const requestJoin = DeclarationReciprocalHome.step(
  (model, roomId: string, username: string) => ({
    model,
    commands: [ClearJoinDraft()],
    outMessage: HomeOutMessage.JoinedRoom({ roomId, username }),
  }),
)
export const HomeBlock = DeclarationReciprocalHomeComposition.toBlock({
  init: DeclarationReciprocalHomeComposition.init(() => ({
    model: HomeModel.make({ username: '', resetCount: 0 }),
  })),
  update: DeclarationReciprocalHomeComposition.update((model, message) =>
    HomeMessage.match(message, {
      SucceededJoinRoom: () => ({ model }),
      CompletedClearJoinDraft: () => ({ model }),
    }),
  ),
  expose: { requestJoin, resetJoinForm },
  EffectsLayer: ClearJoinDraft.layer,
})

export const RoomModel = Schema.Struct({
  maybeUsername: Schema.Option(Schema.String),
})
export const RoomContext = Schema.Struct({ roomId: Schema.String })
export const RoomMessage = Message.defineMessageUnion({
  CompletedLeaveRoom: {},
})
export const RoomOutMessage = Message.defineMessageUnion({
  LeftRoom: { roomId: Schema.String },
})
const DeclarationReciprocalRoom = Block.define('DeclarationReciprocalRoom', {
  Model: RoomModel,
  Message: RoomMessage,
  OutMessage: RoomOutMessage,
})
const DeclarationReciprocalRoomComposition =
  DeclarationReciprocalRoom.toComposition()
const informJoined = DeclarationReciprocalRoom.step(
  (model, username: string, _context: typeof RoomContext.Type) => ({
    model: Struct.modifyFields(model, {
      maybeUsername: () => Option.some(username),
    }),
  }),
)
export const RoomBlock = DeclarationReciprocalRoomComposition.toBlock({
  init: DeclarationReciprocalRoomComposition.init(
    (maybeUsername: Option.Option<string>) => ({
      model: RoomModel.make({ maybeUsername }),
    }),
  ),
  update: DeclarationReciprocalRoomComposition.update(
    (model, message, context: typeof RoomContext.Type) =>
      RoomMessage.match(message, {
        CompletedLeaveRoom: () => ({
          model,
          outMessage: RoomOutMessage.LeftRoom({ roomId: context.roomId }),
        }),
      }),
  ),
  expose: { informJoined },
  EffectsLayer: Layer.empty,
})

export const ApplicationRoute = Route.defineRouteUnion({
  Home: {},
  Room: { roomId: Schema.String },
})
export const RoomInstance = Schema.Struct({
  roomId: Schema.String,
  model: RoomModel,
})
export const ApplicationModel = Schema.Struct({
  home: HomeModel,
  maybeRoomInstance: Schema.Option(RoomInstance),
  route: ApplicationRoute,
})
export const ApplicationMessage = Message.defineMessageUnion({
  GotHomeMessage: { message: HomeBlock.Message },
  GotRoomMessage: { roomId: Schema.String, message: RoomBlock.Message },
})
export const Application = defineApplication({
  Model: ApplicationModel,
  Message: ApplicationMessage,
})

const foldRoomOutMessage = (
  _roomId: string,
  outMessage: typeof RoomOutMessage.Type,
) =>
  RoomOutMessage.match(outMessage, {
    LeftRoom: () =>
      Update.combine([
        Application.step(model => ({
          model: Struct.modifyFields(model, {
            route: () => ApplicationRoute.Home(),
            maybeRoomInstance: () => Option.none(),
          }),
        })),
        HomeBinding.resetJoinForm(''),
      ]),
  })

export const HomeBinding = Application.bindChild(HomeBlock, {
  field: 'home',
  presentWhen: model => model.route._tag === 'Home',
  parentMessage: ApplicationMessage.GotHomeMessage,
  outMessage: {
    fold: HomeOutMessage.match({
      JoinedRoom: ({ roomId, username }) => {
        return Update.combine([
          Application.step(model =>
            RoomBinding.init({
              key: roomId,
              args: [Option.none()],
              toParentModel: room =>
                Struct.modifyFields(model, {
                  maybeRoomInstance: () =>
                    Option.some(RoomInstance.make({ roomId, model: room })),
                }),
            }),
          ),
          RoomBinding.informJoined(roomId, username, { roomId }),
          Application.step(model => ({
            model: Struct.modifyFields(model, {
              route: () => ApplicationRoute.Room({ roomId }),
            }),
          })),
        ])
      },
    }),
  },
})

export const RoomBinding = Application.bindChild(RoomBlock, {
  readAll: model => Option.toArray(model.maybeRoomInstance),
  key: instance => instance.roomId,
  read: instance => instance.model,
  writeAt: (model, roomId, nextRoom) =>
    Struct.modifyFields(model, {
      maybeRoomInstance: Option.map(instance =>
        instance.roomId === roomId
          ? Struct.modifyFields(instance, { model: () => nextRoom })
          : instance,
      ),
    }),
  toParentMessage: (roomId, message) =>
    ApplicationMessage.GotRoomMessage({ roomId, message }),
  fromParentMessage: {
    parentMessage: ApplicationMessage.GotRoomMessage,
    args: (model, { roomId, message }) =>
      model.route._tag === 'Room' && model.route.roomId === roomId
        ? Option.some([roomId, message, { roomId }])
        : Option.none(),
  },
  outMessage: { fold: foldRoomOutMessage },
})

export const ApplicationComposition = Application.toComposition({
  childBindings: [HomeBinding, RoomBinding],
})
export const applicationUpdate = ApplicationComposition.update()
export const requestJoinStep = HomeBinding.requestJoin('room-1', 'alice')

type HomeReset = ReturnType<typeof HomeBinding.resetJoinForm>
type HomeRequestJoin = ReturnType<typeof HomeBinding.requestJoin>
type HomeFold = ReturnType<typeof HomeBinding.fold>
type RoomInform = ReturnType<typeof RoomBinding.informJoined>
type RoomFold = ReturnType<typeof RoomBinding.fold>
type HomeLayerServicesAreExact = Expect<
  Equal<Layer.Services<typeof HomeBlock.EffectsLayer>, DraftStore>
>
type HomeLayerErrorIsExact = Expect<
  Equal<Layer.Error<typeof HomeBlock.EffectsLayer>, never>
>

type HomeArgumentsAreExact = Expect<
  Equal<Parameters<typeof HomeBinding.resetJoinForm>, [username: string]>
>
type HomeRequestArgumentsAreExact = Expect<
  Equal<
    Parameters<typeof HomeBinding.requestJoin>,
    [roomId: string, username: string]
  >
>
type RoomArgumentsAreExact = Expect<
  Equal<
    Parameters<typeof RoomBinding.informJoined>,
    [key: string, username: string, _context: typeof RoomContext.Type]
  >
>
type RoomInitConfig = Parameters<typeof RoomBinding.init>[0]
type RoomInitKeyIsExact = Expect<Equal<RoomInitConfig['key'], string>>
type RoomInitArgumentsAreExact = Expect<
  Equal<RoomInitConfig['args'], [maybeUsername: Option.Option<string>]>
>
type HomeRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<HomeReset>,
    Block.Scoped<
      'home',
      Update.RequirementsOf<typeof HomeBlock.expose.resetJoinForm>
    >
  >
>
type RoomRequirementsAreExact = Expect<
  Equal<Update.RequirementsOf<RoomInform>, never>
>
type RoomFoldRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<typeof RoomBinding.fold>,
    Block.Scoped<
      'home',
      Update.RequirementsOf<typeof HomeBlock.expose.resetJoinForm>
    >
  >
>
type HomeRequestRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<HomeRequestJoin>,
    Block.Scoped<
      'home',
      Update.RequirementsOf<typeof HomeBlock.expose.requestJoin>
    >
  >
>
type HomeOutMessageIsExact = Expect<
  Equal<ReturnOutMessage<ReturnType<HomeReset>>, never>
>
type RoomOutMessageIsExact = Expect<
  Equal<ReturnOutMessage<ReturnType<RoomInform>>, never>
>
type RoomFoldOutMessageIsConsumed = Expect<
  Equal<ReturnOutMessage<RoomFold>, never>
>
type HomeRequestOutMessageIsConsumed = Expect<
  Equal<ReturnOutMessage<ReturnType<HomeRequestJoin>>, never>
>
type HomeRegistrationIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<HomeReset>>,
    Block.BindingRequirement<'home', typeof HomeBlock>
  >
>
type RoomRegistrationIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<RoomInform>>,
    Block.BindingRequirement<'DeclarationReciprocalRoom', typeof RoomBlock>
  >
>
type HomeRequestRegistrationIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<HomeRequestJoin>>,
    | Block.BindingRequirement<'home', typeof HomeBlock>
    | Block.BindingRequirement<'DeclarationReciprocalRoom', typeof RoomBlock>
  >
>
type HomeFoldRegistrationIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<HomeFold>,
    Block.BindingRequirement<'home', typeof HomeBlock>
  >
>
type RoomFoldRegistrationIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<RoomFold>,
    | Block.BindingRequirement<'home', typeof HomeBlock>
    | Block.BindingRequirement<'DeclarationReciprocalRoom', typeof RoomBlock>
  >
>
type ApplicationRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<typeof applicationUpdate>,
    Block.Scoped<
      'home',
      Update.RequirementsOf<typeof HomeBlock.expose.resetJoinForm>
    >
  >
>
type ApplicationRegistrationIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<typeof applicationUpdate>>,
    | Block.BindingRequirement<'home', typeof HomeBlock>
    | Block.BindingRequirement<'DeclarationReciprocalRoom', typeof RoomBlock>
  >
>

export type ReciprocalCoordinationAssertions = [
  HomeLayerServicesAreExact,
  HomeLayerErrorIsExact,
  HomeArgumentsAreExact,
  HomeRequestArgumentsAreExact,
  RoomArgumentsAreExact,
  RoomInitKeyIsExact,
  RoomInitArgumentsAreExact,
  HomeRequirementsAreExact,
  RoomRequirementsAreExact,
  RoomFoldRequirementsAreExact,
  HomeRequestRequirementsAreExact,
  HomeOutMessageIsExact,
  RoomOutMessageIsExact,
  RoomFoldOutMessageIsConsumed,
  HomeRequestOutMessageIsConsumed,
  HomeRegistrationIsExact,
  RoomRegistrationIsExact,
  HomeRequestRegistrationIsExact,
  HomeFoldRegistrationIsExact,
  RoomFoldRegistrationIsExact,
  ApplicationRequirementsAreExact,
  ApplicationRegistrationIsExact,
]

const DirectReciprocalModel = Schema.Struct({
  leftHome: HomeModel,
  rightHome: HomeModel,
})
const DirectReciprocalMessage = Message.defineMessageUnion({
  GotLeftHomeMessage: { message: HomeBlock.Message },
  GotRightHomeMessage: { message: HomeBlock.Message },
})
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture compares independent Application graphs for direct sibling coordination.
export const DirectReciprocalApplication = defineApplication({
  Model: DirectReciprocalModel,
  Message: DirectReciprocalMessage,
})

export const LeftHomeBinding = DirectReciprocalApplication.bindChild(
  HomeBlock,
  {
    field: 'leftHome',
    parentMessage: DirectReciprocalMessage.GotLeftHomeMessage,
    outMessage: {
      fold: HomeOutMessage.match({
        JoinedRoom: () => RightHomeBinding.resetJoinForm('from-left'),
      }),
    },
  },
)

export const RightHomeBinding = DirectReciprocalApplication.bindChild(
  HomeBlock,
  {
    field: 'rightHome',
    parentMessage: DirectReciprocalMessage.GotRightHomeMessage,
    outMessage: {
      fold: HomeOutMessage.match({
        JoinedRoom: () => LeftHomeBinding.resetJoinForm('from-right'),
      }),
    },
  },
)

// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture keeps the direct sibling graph distinct from the keyed sibling graph.
export const DirectReciprocalComposition =
  DirectReciprocalApplication.toComposition({
    childBindings: [LeftHomeBinding, RightHomeBinding],
  })

type LeftHomeRequest = ReturnType<typeof LeftHomeBinding.requestJoin>
type LeftHomeArgumentsAreExact = Expect<
  Equal<
    Parameters<typeof LeftHomeBinding.requestJoin>,
    [roomId: string, username: string]
  >
>
type LeftHomeRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<LeftHomeRequest>,
    | Block.Scoped<
        'leftHome',
        Update.RequirementsOf<typeof HomeBlock.expose.requestJoin>
      >
    | Block.Scoped<
        'rightHome',
        Update.RequirementsOf<typeof HomeBlock.expose.resetJoinForm>
      >
  >
>
type LeftHomeRegistrationIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<LeftHomeRequest>>,
    | Block.BindingRequirement<'leftHome', typeof HomeBlock>
    | Block.BindingRequirement<'rightHome', typeof HomeBlock>
  >
>

const KeyedHomeEntry = Schema.Struct({
  id: Schema.String,
  home: HomeModel,
})
const KeyedReciprocalModel = Schema.Struct({
  leftHomes: Schema.Array(KeyedHomeEntry),
  rightHomes: Schema.Array(KeyedHomeEntry),
})
const KeyedReciprocalMessage = Message.defineMessageUnion({
  GotLeftHomeMessage: { id: Schema.String, message: HomeBlock.Message },
  GotRightHomeMessage: { id: Schema.String, message: HomeBlock.Message },
})
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture compares independent Application graphs for keyed sibling coordination.
export const KeyedReciprocalApplication = defineApplication({
  Model: KeyedReciprocalModel,
  Message: KeyedReciprocalMessage,
})

export const LeftKeyedHomeBinding = KeyedReciprocalApplication.bindChild(
  HomeBlock,
  {
    field: 'leftHomes',
    key: 'id',
    childField: 'home',
    toParentMessage: (id, message) =>
      KeyedReciprocalMessage.GotLeftHomeMessage({ id, message }),
    fromParentMessage: false,
    outMessage: { fold: foldLeftKeyedHomeOutMessage },
  },
)

export const RightKeyedHomeBinding = KeyedReciprocalApplication.bindChild(
  HomeBlock,
  {
    field: 'rightHomes',
    key: 'id',
    childField: 'home',
    toParentMessage: (id, message) =>
      KeyedReciprocalMessage.GotRightHomeMessage({ id, message }),
    fromParentMessage: false,
    outMessage: { fold: foldRightKeyedHomeOutMessage },
  },
)

// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture keeps the keyed sibling graph distinct from the direct sibling graph.
export const KeyedReciprocalComposition =
  KeyedReciprocalApplication.toComposition({
    childBindings: [LeftKeyedHomeBinding, RightKeyedHomeBinding],
  })

type LeftKeyedHomeRequest = ReturnType<typeof LeftKeyedHomeBinding.requestJoin>
type LeftKeyedHomeArgumentsAreExact = Expect<
  Equal<
    Parameters<typeof LeftKeyedHomeBinding.requestJoin>,
    [key: string, roomId: string, username: string]
  >
>
type LeftKeyedHomeRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<LeftKeyedHomeRequest>,
    | Block.Scoped<
        'leftHomes',
        Update.RequirementsOf<typeof HomeBlock.expose.requestJoin>
      >
    | Block.Scoped<
        'rightHomes',
        Update.RequirementsOf<typeof HomeBlock.expose.resetJoinForm>
      >
  >
>
type LeftKeyedHomeRegistrationIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<LeftKeyedHomeRequest>>,
    | Block.BindingRequirement<'leftHomes', typeof HomeBlock>
    | Block.BindingRequirement<'rightHomes', typeof HomeBlock>
  >
>

export type AdditionalReciprocalAssertions = [
  LeftHomeArgumentsAreExact,
  LeftHomeRequirementsAreExact,
  LeftHomeRegistrationIsExact,
  LeftKeyedHomeArgumentsAreExact,
  LeftKeyedHomeRequirementsAreExact,
  LeftKeyedHomeRegistrationIsExact,
]

function foldLeftKeyedHomeOutMessage(
  _key: string,
  outMessage: typeof HomeOutMessage.Type,
) {
  return HomeOutMessage.match(outMessage, {
    JoinedRoom: () =>
      RightKeyedHomeBinding.resetJoinForm('right-home', 'from-left'),
  })
}

function foldRightKeyedHomeOutMessage(
  _key: string,
  outMessage: typeof HomeOutMessage.Type,
) {
  return HomeOutMessage.match(outMessage, {
    JoinedRoom: () =>
      LeftKeyedHomeBinding.resetJoinForm('left-home', 'from-right'),
  })
}
