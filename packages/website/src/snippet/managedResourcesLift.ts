import { Effect, Option, Schema } from 'effect'
import { Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { init } from './init'
import { Message } from './message'
import { Model } from './model'
import { update } from './update'
import * as VideoCall from './videoCall'

const SIGNALING_URL = 'wss://example.com/call/signaling'

const Call = Block.define('Call', { Model, Message })
const SignalingSocket = Call.resource<WebSocket>()('SignalingSocket')

const videoCall = VideoCall.block.connection({
  read: (model: Model) => model.videoCall,
  write: (model, nextVideoCall) =>
    modifyFields(model, { videoCall: () => Option.some(nextVideoCall) }),
  parentMessage: Message.GotVideoCallMessage,
})

const call = Call.register({ children: [videoCall] })

export const managedResources = call.managedResources(entry => ({
  signalingSocket: entry('ManageSignalingSocket', Schema.Option(Schema.Null), {
    resource: SignalingSocket,
    modelToMaybeRequirements: model => Option.as(model.videoCall, null),
    onAcquired: () => Message.OpenedSignaling(),
    onReleased: () => Message.ClosedSignaling(),
    onAcquireError: error =>
      Message.FailedSignaling({ error: globalThis.String(error) }),
    handler: function* () {
      return {
        acquire: () => Effect.try(() => new WebSocket(SIGNALING_URL)),
        release: socket => Effect.sync(() => socket.close()),
      }
    },
  }),
}))

export const block = call.assemble({
  init,
  update,
  managedResources,
  EffectsLayer: managedResources.signalingSocket.layer,
})
