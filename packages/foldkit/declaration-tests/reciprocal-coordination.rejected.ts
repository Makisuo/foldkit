import { Option } from 'effect'

import {
  Application,
  ApplicationMessage,
  DirectReciprocalApplication,
  HomeBinding,
  HomeBlock,
  HomeOutMessage,
  KeyedReciprocalApplication,
  LeftHomeBinding,
  LeftKeyedHomeBinding,
  RightHomeBinding,
  RightKeyedHomeBinding,
  RoomBinding,
  RoomBlock,
} from './reciprocal-coordination.accepted.js'

// @ts-expect-error Room policy uses the omitted Home Binding.
const MissingHomeComposition = Application.toComposition({
  childBindings: [RoomBinding],
})
// @ts-expect-error Room policy uses HomeBinding.resetJoinForm.
MissingHomeComposition.update()

// @ts-expect-error Home policy uses the omitted Room Binding.
const MissingRoomComposition = Application.toComposition({
  childBindings: [HomeBinding],
})
// @ts-expect-error Home policy uses RoomBinding.informJoined.
MissingRoomComposition.update()

// @ts-expect-error Left direct policy uses the omitted right Home Binding.
DirectReciprocalApplication.toComposition({
  childBindings: [LeftHomeBinding],
})
// @ts-expect-error Right direct policy uses the omitted left Home Binding.
DirectReciprocalApplication.toComposition({
  childBindings: [RightHomeBinding],
})
// @ts-expect-error Left keyed policy uses the omitted right Home Binding.
KeyedReciprocalApplication.toComposition({
  childBindings: [LeftKeyedHomeBinding],
})
// @ts-expect-error Right keyed policy uses the omitted left Home Binding.
KeyedReciprocalApplication.toComposition({
  childBindings: [RightKeyedHomeBinding],
})

// @ts-expect-error resetJoinForm requires exactly one username.
HomeBinding.resetJoinForm()
// @ts-expect-error resetJoinForm accepts no extra arguments.
HomeBinding.resetJoinForm('', 'extra')
// @ts-expect-error informJoined requires key, username, and Room context.
RoomBinding.informJoined('room-1', 'alice')
// @ts-expect-error informJoined preserves the string Room context field.
RoomBinding.informJoined('room-1', 'alice', { roomId: 1 })

// @ts-expect-error A child with OutMessages requires an OutMessage policy.
// oxfmt-ignore
Application.bindChild(HomeBlock, { field: 'home', parentMessage: ApplicationMessage.GotHomeMessage })

// @ts-expect-error A keyed child with OutMessages requires an OutMessage policy.
// oxfmt-ignore
Application.bindChild(RoomBlock, { readAll: model => Option.toArray(model.maybeRoomInstance), key: instance => instance.roomId, read: instance => instance.model, writeAt: model => model, toParentMessage: (roomId, message) => ApplicationMessage.GotRoomMessage({ roomId, message }), fromParentMessage: false })

// @ts-expect-error A static policy must accept every refined child OutMessage.
// oxfmt-ignore
Application.bindChild(HomeBlock, { field: 'home', parentMessage: ApplicationMessage.GotHomeMessage, outMessage: { fold: (_outMessage: Extract<typeof HomeOutMessage.Type, Readonly<{ username: 'alice' }>>) => Application.step(model => ({ model })) } })
