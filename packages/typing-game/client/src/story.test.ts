import { Option, pipe } from 'effect'
import { Url } from 'foldkit'
import { Command, given, message, model, story } from 'foldkit/story'
import { modifyFields } from 'foldkit/struct'
import { describe, expect, test } from 'vitest'

import * as Shared from '@typing-game/shared'

import { NavigateToRoom } from './composition'
import { Message } from './message'
import { Model, RoomInstance } from './model'
import { Home, Room } from './page'
import { Message as HomeMessage } from './page/home/message'
import { HomeStep } from './page/home/model'
import {
  ClearSession,
  FetchRoom,
  FocusRoomPageUsernameInput,
  LoadSession,
  SavePlayerSession,
  StartGame,
} from './page/room/command'
import { Message as RoomMessage } from './page/room/message'
import { RoomAsyncData } from './page/room/model'
import { NavigateHome } from './page/room/update'
import { ApplicationRoute } from './route'
import { update } from './update'

const ROOM_A = 'r1'
const ROOM_B = 'r2'

const alice = { id: 'p1', username: 'alice' }
const bob = { id: 'p2', username: 'bob' }

const waitingRoom: Shared.Room = {
  id: ROOM_A,
  players: [alice],
  hostId: alice.id,
  status: Shared.Waiting.make({}),
  maybeGame: Option.none(),
  maybeScoreboard: Option.none(),
  createdAt: 0,
  usedGameTexts: [],
}

const selectActionHome: typeof Home.Model.Type = {
  homeStep: HomeStep.SelectAction({
    username: 'alice',
    selectedAction: 'CreateRoom',
  }),
  formError: Option.none(),
}

const joinedRoom: typeof Room.Model.Type = {
  roomAsyncData: RoomAsyncData.Success({ data: waitingRoom }),
  maybeSession: Option.some({ roomId: ROOM_A, player: alice }),
  userGameText: '',
  charsTyped: 0,
  username: 'alice',
  isRoomIdCopyIndicatorVisible: false,
  exitCountdownSecondsLeft: 0,
}

const givenHomeRoute = given<Model>({
  route: ApplicationRoute.Home(),
  home: selectActionHome,
  maybeRoomInstance: Option.none(),
})

const givenRoomRoute = given<Model>({
  route: ApplicationRoute.Room({ roomId: ROOM_A }),
  home: selectActionHome,
  maybeRoomInstance: Option.some({ roomId: ROOM_A, model: joinedRoom }),
})

const roomUrl = (roomId: string): Url.Url =>
  pipe(
    Url.fromString(`https://typing-game.test/room/${roomId}`),
    Option.getOrThrow,
  )

const homeUrl = pipe(
  Url.fromString('https://typing-game.test/'),
  Option.getOrThrow,
)

const makeRoom = (roomId: string, createdAt: number): Shared.Room =>
  Shared.Room.make({
    id: roomId,
    players: [],
    hostId: '',
    status: Shared.Waiting.make({}),
    maybeGame: Option.none(),
    maybeScoreboard: Option.none(),
    createdAt,
    usedGameTexts: [],
  })

const getRoomInstance = (model: Model): RoomInstance =>
  pipe(model.maybeRoomInstance, Option.getOrThrow)

const dirtyRoomModel = (roomId: string) =>
  modifyFields(Room.block.init(Option.none()).model, {
    roomAsyncData: () => RoomAsyncData.Success({ data: makeRoom(roomId, 37) }),
    maybeSession: () => Option.some({ roomId, player: alice }),
    userGameText: () => 'typed text',
    charsTyped: () => 10,
    username: () => 'prior username',
    isRoomIdCopyIndicatorVisible: () => true,
    exitCountdownSecondsLeft: () => 4,
  })

const modelWithRoom = (
  route: Model['route'],
  roomId: string,
  roomModel = dirtyRoomModel(roomId),
): Model =>
  Model.make({
    route,
    home: selectActionHome,
    maybeRoomInstance: Option.some(
      RoomInstance.make({ roomId, model: roomModel }),
    ),
  })

describe('key presses on the Home route', () => {
  test('a Home key press moves the home selection and leaves the room alone', () => {
    story(
      update,
      givenHomeRoute,
      message(
        Message.GotHomeMessage({
          message: HomeMessage.PressedKey({ key: 'ArrowDown' }),
        }),
      ),
      model(model => {
        expect(model.home.homeStep).toMatchObject({
          _tag: 'SelectAction',
          selectedAction: 'JoinRoom',
        })
        expect(model.maybeRoomInstance).toEqual(Option.none())
      }),
      Command.expectNone(),
    )
  })

  test('a Room key press does nothing', () => {
    story(
      update,
      givenHomeRoute,
      message(
        Message.GotRoomMessage({
          roomId: 'r1',
          message: RoomMessage.PressedKey({ key: 'Enter' }),
        }),
      ),
      model(model => {
        expect(model.maybeRoomInstance).toEqual(Option.none())
      }),
      Command.expectNone(),
    )
  })
})

describe('key presses on the Room route', () => {
  test('a Room key press starts the game and leaves home alone', () => {
    story(
      update,
      givenRoomRoute,
      message(
        Message.GotRoomMessage({
          roomId: 'r1',
          message: RoomMessage.PressedKey({ key: 'Enter' }),
        }),
      ),
      Command.resolve(StartGame, RoomMessage.SucceededStartGame()),
      model(model => {
        expect(model.home).toEqual(selectActionHome)
      }),
    )
  })
})

describe('Room navigation', () => {
  test('changing Room routes replaces the child and starts the new Room load', () => {
    const initialModel = modelWithRoom(
      ApplicationRoute.Room({ roomId: ROOM_A }),
      ROOM_A,
    )
    const expectedRoomInit = Room.block.init(Option.some(ROOM_B))

    story(
      update,
      given(initialModel),
      message(Message.ChangedUrl({ url: roomUrl(ROOM_B) })),
      model(model => {
        expect(model.route).toEqual(ApplicationRoute.Room({ roomId: ROOM_B }))
        expect(getRoomInstance(model)).toEqual(
          RoomInstance.make({ roomId: ROOM_B, model: expectedRoomInit.model }),
        )
      }),
      Command.resolveAllExact(
        [
          LoadSession({ roomId: ROOM_B }),
          RoomMessage.CompletedLoadSession({ maybeSession: Option.none() }),
        ],
        [
          FetchRoom({ roomId: ROOM_B }),
          RoomMessage.SucceededFetchRoom({ room: makeRoom(ROOM_B, 100) }),
        ],
        [
          FocusRoomPageUsernameInput,
          RoomMessage.CompletedFocusRoomPageUsernameInput(),
        ],
      ),
    )
  })

  test('leaving a Room removes its child Model', () => {
    const initialModel = modelWithRoom(
      ApplicationRoute.Room({ roomId: ROOM_A }),
      ROOM_A,
    )

    story(
      update,
      given(initialModel),
      message(Message.ChangedUrl({ url: homeUrl })),
      model(model => {
        expect(model.route).toEqual(ApplicationRoute.Home())
        expect(model.maybeRoomInstance).toEqual(Option.none())
      }),
      Command.expectNone(),
    )
  })

  test('preserves the child Model on a same-Room URL', () => {
    const roomModel = dirtyRoomModel(ROOM_A)
    const initialModel = modelWithRoom(
      ApplicationRoute.Room({ roomId: ROOM_A }),
      ROOM_A,
      roomModel,
    )

    story(
      update,
      given(initialModel),
      message(Message.ChangedUrl({ url: roomUrl(ROOM_A) })),
      model(model => {
        expect(getRoomInstance(model).model).toStrictEqual(roomModel)
      }),
      Command.expectNone(),
    )
  })
})

describe('Room occurrence identity', () => {
  test('ignores stale child results after the active Room changes', () => {
    const initialModel = modelWithRoom(
      ApplicationRoute.Room({ roomId: ROOM_B }),
      ROOM_B,
    )
    const staleMessages: ReadonlyArray<typeof RoomMessage.Type> = [
      RoomMessage.SucceededJoinRoom({ player: alice }),
      RoomMessage.CompletedLoadSession({
        maybeSession: Option.some({ roomId: ROOM_A, player: alice }),
      }),
      RoomMessage.SucceededFetchRoom({ room: makeRoom(ROOM_A, 90) }),
      RoomMessage.UpdatedRoom({
        room: makeRoom(ROOM_A, 91),
        maybePlayerProgress: Option.none(),
      }),
      RoomMessage.SucceededCopyRoomId(),
      RoomMessage.CompletedWaitForExitCountdownInterval(),
    ]

    for (const staleMessage of staleMessages) {
      story(
        update,
        given(initialModel),
        message(
          Message.GotRoomMessage({
            roomId: ROOM_A,
            message: staleMessage,
          }),
        ),
        model(model => {
          expect(model).toBe(initialModel)
        }),
        Command.expectNone(),
      )
    }
  })

  test('uses the originating Room ID when a payload contains another ID', () => {
    const mismatchedRoomModel = modifyFields(dirtyRoomModel(ROOM_A), {
      roomAsyncData: () =>
        RoomAsyncData.Success({
          data: { ...waitingRoom, id: 'payload-room' },
        }),
      exitCountdownSecondsLeft: () => 0,
    })
    const initialModel = modelWithRoom(
      ApplicationRoute.Room({ roomId: ROOM_A }),
      ROOM_A,
      mismatchedRoomModel,
    )

    story(
      update,
      given(initialModel),
      message(
        Message.GotRoomMessage({
          roomId: ROOM_A,
          message: RoomMessage.PressedKey({ key: 'Backspace' }),
        }),
      ),
      Command.resolveAllExact(
        [ClearSession({ roomId: ROOM_A }), RoomMessage.CompletedClearSession()],
        [NavigateHome(), RoomMessage.CompletedNavigateHome()],
      ),
    )
  })

  test('starts the game in the originating Room when the payload ID differs', () => {
    const mismatchedRoomModel = modifyFields(dirtyRoomModel(ROOM_A), {
      roomAsyncData: () =>
        RoomAsyncData.Success({
          data: { ...waitingRoom, id: 'payload-room' },
        }),
    })
    const initialModel = modelWithRoom(
      ApplicationRoute.Room({ roomId: ROOM_A }),
      ROOM_A,
      mismatchedRoomModel,
    )

    story(
      update,
      given(initialModel),
      message(
        Message.GotRoomMessage({
          roomId: ROOM_A,
          message: RoomMessage.PressedKey({ key: 'Enter' }),
        }),
      ),
      Command.resolveAllExact([
        StartGame({ roomId: ROOM_A, playerId: alice.id }),
        RoomMessage.SucceededStartGame(),
      ]),
    )
  })
})

describe('Home and Room coordination', () => {
  test.each([
    [
      'created',
      HomeMessage.SucceededCreateRoom({ roomId: ROOM_A, player: alice }),
    ],
    [
      'joined',
      HomeMessage.SucceededJoinRoomFromHome({
        roomId: ROOM_A,
        player: alice,
      }),
    ],
  ])('prepares a clean Room after Home has %s it', (_name, homeMessage) => {
    const priorRoomModel = dirtyRoomModel(ROOM_A)
    const initialModel = modelWithRoom(
      ApplicationRoute.Home(),
      ROOM_A,
      priorRoomModel,
    )

    story(
      update,
      given(initialModel),
      message(Message.GotHomeMessage({ message: homeMessage })),
      model(model => {
        const roomInstance = getRoomInstance(model)

        expect(model.route).toEqual(ApplicationRoute.Home())
        expect(roomInstance.roomId).toBe(ROOM_A)
        expect(roomInstance.model).not.toBe(priorRoomModel)
        expect(roomInstance.model.roomAsyncData).toEqual(RoomAsyncData.Idle())
        expect(roomInstance.model.maybeSession).toEqual(
          Option.some({ roomId: ROOM_A, player: alice }),
        )
        expect(roomInstance.model.userGameText).toBe('')
        expect(roomInstance.model.charsTyped).toBe(0)
        expect(roomInstance.model.username).toBe('')
        expect(roomInstance.model.isRoomIdCopyIndicatorVisible).toBe(false)
        expect(roomInstance.model.exitCountdownSecondsLeft).toBe(0)
      }),
      Command.resolveAllExact(
        [
          SavePlayerSession({
            session: { roomId: ROOM_A, player: alice },
          }),
          RoomMessage.CompletedSavePlayerSession(),
        ],
        [NavigateToRoom({ roomId: ROOM_A }), Message.CompletedNavigateToRoom()],
      ),
    )
  })

  test('ignores a delayed Home result after entering another Room', () => {
    const initialModel = modelWithRoom(
      ApplicationRoute.Room({ roomId: ROOM_B }),
      ROOM_B,
    )

    story(
      update,
      given(initialModel),
      message(
        Message.GotHomeMessage({
          message: HomeMessage.SucceededCreateRoom({
            roomId: ROOM_A,
            player: bob,
          }),
        }),
      ),
      model(model => {
        expect(model).toBe(initialModel)
      }),
      Command.expectNone(),
    )
  })
})
