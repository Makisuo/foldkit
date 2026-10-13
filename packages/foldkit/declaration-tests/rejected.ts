import { Effect, Layer, Option, Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import * as Block from 'foldkit/block'
import { Server } from 'foldkit/experimental'
import { defineMessageUnion } from 'foldkit/message'
import * as Update from 'foldkit/update'

import {
  Child,
  ChildMessage,
  Measure,
  ParentMessage,
  ParentModel,
  RefinedChoice,
  child,
  type ChildModel,
} from './accepted.js'

const InvalidApplication = defineApplication({
  Model: ParentModel,
  Message: ParentMessage,
})
const invalidApplicationImplementation = {
  init: () => ({
    model: ParentModel.make({ child: Child.Model.make({ value: 0 }) }),
  }),
  update: InvalidApplication.update(model => ({ model })),
  EffectsLayer: Layer.empty,
}
const invalidElementView = InvalidApplication.view((model, h) =>
  h.main([], [globalThis.String(model.child.value)]),
)
const invalidDocumentView = InvalidApplication.view((model, h) => ({
  title: 'Invalid application fixture',
  body: h.main([], [globalThis.String(model.child.value)]),
}))

// @ts-expect-error Page Applications require a Document view.
InvalidApplication.make({
  ...invalidApplicationImplementation,
  container: null,
  view: invalidElementView,
})

// @ts-expect-error Element Applications require an HTML view.
InvalidApplication.makeElement({
  ...invalidApplicationImplementation,
  container: null,
  view: invalidDocumentView,
})

const requiredContextUpdate = InvalidApplication.update(
  (model, _message, requiredContext: string) => {
    void requiredContext
    return { model }
  },
)

// @ts-expect-error Application update cannot require root dispatch context.
InvalidApplication.makeElement({
  ...invalidApplicationImplementation,
  update: requiredContextUpdate,
  container: null,
  view: invalidElementView,
})

const WiderMessage = defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
  RequestedRefresh: {},
  RequestedExtraWork: {},
})
const WiderMessageApplication = defineApplication({
  Model: ParentModel,
  Message: WiderMessage,
})
const widerMessageUpdate = WiderMessageApplication.update(
  (model, _message): Update.Return<ParentModel, ParentMessage> => ({ model }),
)

// @ts-expect-error Application update must accept exactly the root Message.
InvalidApplication.makeElement({
  ...invalidApplicationImplementation,
  update: widerMessageUpdate,
  container: null,
  view: invalidElementView,
})

const WiderInputModel = Schema.Struct({})
const WiderInputModelApplication = defineApplication({
  Model: WiderInputModel,
  Message: ParentMessage,
})
const widerModelUpdate = WiderInputModelApplication.update(
  (_model, _message): Update.Return<ParentModel, ParentMessage> => ({
    model: ParentModel.make({ child: Child.Model.make({ value: 0 }) }),
  }),
)

// @ts-expect-error Application update must accept exactly the root Model.
InvalidApplication.makeElement({
  ...invalidApplicationImplementation,
  update: widerModelUpdate,
  container: null,
  view: invalidElementView,
})

Server.renderToString(
  InvalidApplication,
  // @ts-expect-error Server rendering requires a page-owning Document view.
  { ...invalidApplicationImplementation, view: invalidElementView },
  { isHydratable: false },
)

// @ts-expect-error Early Block IDs cannot contain a scoped identity separator.
Block.define('Invalid::EarlyBlock').define
// @ts-expect-error Typed Block IDs cannot contain a scoped identity separator.
Block.define('Invalid::TypedBlock', {
  Model: ParentModel,
  Message: ParentMessage,
})

const ConstructorOwner = Block.define('DeclarationTestsConstructor')
const ConstructorMessage = defineMessageUnion({ CompletedWork: {} })
const ForeignPrimitiveMessage = defineMessageUnion({ ForeignCompleted: {} })

const TypedPrimitiveOwner = Block.define(
  'DeclarationTestsTypedPrimitiveOwner',
  {
    Model: ParentModel,
    Message: ParentMessage,
  },
)

TypedPrimitiveOwner.command('ForeignCommand', {
  // @ts-expect-error A typed Block Command must produce its owner's Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})
TypedPrimitiveOwner.mount('ForeignMount', {
  // @ts-expect-error A typed Block Mount must produce its owner's Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})
TypedPrimitiveOwner.mountStream('ForeignMountStream', {
  // @ts-expect-error A typed Block stream Mount must produce its owner's Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})

const TypedPrimitiveApplication = defineApplication({
  Model: ParentModel,
  Message: ParentMessage,
})

TypedPrimitiveApplication.command('ForeignApplicationCommand', {
  // @ts-expect-error A root Command must produce the Application Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})
TypedPrimitiveApplication.mount('ForeignApplicationMount', {
  // @ts-expect-error A root Mount must produce the Application Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})
TypedPrimitiveApplication.mountStream('ForeignApplicationMountStream', {
  // @ts-expect-error A root stream Mount must produce the Application Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})

// @ts-expect-error Owned primitive names cannot contain a scoped identity separator.
ConstructorOwner.command('Invalid::Work', {
  messages: [ConstructorMessage.CompletedWork],
})

const HostWork = ConstructorOwner.command('HostWork', {
  messages: [ConstructorMessage.CompletedWork],
})

ConstructorOwner.command('InvalidConstructedWork', {
  messages: [ConstructorMessage.CompletedWork],
  // @ts-expect-error Foldkit handlers are unavailable while another handler is constructed.
  handler: function* () {
    yield* HostWork().effect

    return () => Effect.succeed(ConstructorMessage.CompletedWork())
  },
})

// @ts-expect-error A replacement Layer must preserve the Block's exact handler outputs.
Child.replaceEffectsLayer(Layer.empty)

const ForeignParentMessage = defineMessageUnion({ ReceivedChildMessage: {} })
const ExtraParentMessage = defineMessageUnion({
  GotChildMessage: { message: ChildMessage, requestId: Schema.String },
})
const WrongChildParentMessage = defineMessageUnion({
  GotChildMessage: { message: Schema.String },
})

const foreignChild = Child.connection({
  placement: 'foreign-child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (_model: ParentModel, nextChild: ChildModel) =>
    ParentModel.make({ child: nextChild }),
  toParentMessage: () => ForeignParentMessage.ReceivedChildMessage(),
})

Child.connection({
  Model: ParentModel,
  field: 'child',
  // @ts-expect-error A parent Message constructor is exclusive with a custom mapper.
  parentMessage: ParentMessage.GotChildMessage,
  toParentMessage: (message: ChildMessage) =>
    ParentMessage.GotChildMessage({ message }),
})

Child.connection({
  Model: ParentModel,
  field: 'child',
  // @ts-expect-error A parent Message constructor must accept this Block's Message.
  parentMessage: WrongChildParentMessage.GotChildMessage,
})

Child.connection({
  Model: ParentModel,
  field: 'child',
  // @ts-expect-error A parent Message constructor cannot require fields beyond the child Message.
  parentMessage: ExtraParentMessage.GotChildMessage,
})

Child.keyedConnection({
  readAll: (model: ParentModel) => [model.child],
  key: () => 'only',
  read: childModel => childModel,
  writeAt: (_model, _key, nextChild) => ParentModel.make({ child: nextChild }),
  toParentMessage: (_key, message) =>
    ParentMessage.GotChildMessage({ message }),
  // @ts-expect-error Keyed connections require an explicit mapper because it receives the key.
  parentMessage: ParentMessage.GotChildMessage,
})

const invalidParentBase = Block.define('DeclarationTestsInvalidParent').define({
  Model: ParentModel,
  Message: ParentMessage,
})
// @ts-expect-error Registered child bindings must use the definition's parent Message.
invalidParentBase.register({
  children: [foreignChild],
})

const omittedChildBase = Block.define('DeclarationTestsOmittedChild').define({
  Model: ParentModel,
  Message: ParentMessage,
})

Block.define('DeclarationTestsInvalidDirectContracts', {
  Model: ParentModel,
  Message: ParentMessage,
  // @ts-expect-error Graph registrations belong to the register stage.
  children: [child],
})

const omittedChildUpdate = omittedChildBase.update((model, message) =>
  ParentMessage.match(message, {
    GotChildMessage: ({ message }) => child.fold(model, message),
    RequestedRefresh: () => ({ model }),
  }),
)

omittedChildBase.assemble({
  init: () => ({
    model: ParentModel.make({ child: Child.Model.make({ value: 0 }) }),
  }),
  update: omittedChildUpdate,
  // @ts-expect-error A Block implementation cannot use an unregistered child operation.
  EffectsLayer: Layer.empty,
})

ParentMessage.match<Update.Return<ParentModel, ParentMessage>>(
  ParentMessage.GotChildMessage({
    message: ChildMessage.RequestedRead(),
  }),
  {
    GotChildMessage: () =>
      // @ts-expect-error An explicit plain Return cannot erase child registration evidence.
      Update.foldChildInit(child.init(), {
        toParentModel: childModel => ParentModel.make({ child: childModel }),
        toParentMessage: message => message,
      }),
    RequestedRefresh: () => ({
      model: ParentModel.make({ child: Child.Model.make({ value: 0 }) }),
    }),
  },
)

RefinedChoice.OutMessage.make({
  // @ts-expect-error The completed generic Block retains its refined constructor input.
  value: 'Three',
})

const refinedModel = RefinedChoice.Model.make({ value: 'One' })

// @ts-expect-error Direct Steps retain their refined input after assembly.
RefinedChoice.steps.finish(refinedModel, 'Three')

const invalidViewBase = Block.define('DeclarationTestsInvalidView').define({
  Model: ParentModel,
  Message: ParentMessage,
})
const invalidViewDefinition = invalidViewBase.register({ children: [child] })

invalidViewDefinition.view((model, h) => {
  const config = child.embedView({ slotId: 'child', model: model.child })

  h.block(config)
  h.block({
    // @ts-expect-error A public lookalike cannot forge private binding scope evidence.
    __blockConfigEvidence: {
      config,
      parentMessage: ParentMessage.RequestedRefresh(),
      mountRequirements: Measure,
    },
  })

  return h.empty
})
