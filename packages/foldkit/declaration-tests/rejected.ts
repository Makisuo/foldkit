import { Context, Effect, Layer, Option, Schema } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import * as Block from 'foldkit/block'
import * as Command from 'foldkit/command'
import { Server } from 'foldkit/experimental'
import { defineMessageUnion } from 'foldkit/message'
import * as Runtime from 'foldkit/runtime'
import * as Update from 'foldkit/update'

import {
  Child,
  ChildMessage,
  type ChildModel,
  type CompletedChild,
  type CompletedChoice,
  Measure,
  ParentMessage,
  ParentModel,
  RefinedChoice,
  child,
  makeProvisionElement,
  makeProvisionPageAwaitingDependency,
} from './accepted.js'

const InvalidApplicationDefinition = (() => {
  const ApplicationDefinition = defineApplication({
    Model: ParentModel,
    Message: ParentMessage,
  })

  return ApplicationDefinition
})()
const invalidApplicationImplementation = {
  init: () => ({
    model: ParentModel.make({ child: Child.Model.make({ value: 0 }) }),
  }),
  update: InvalidApplicationDefinition.update(model => ({ model })),
  EffectsLayer: Layer.empty,
}
const invalidElementView = InvalidApplicationDefinition.view((model, h) =>
  h.main([], [globalThis.String(model.child.value)]),
)
const invalidDocumentView = InvalidApplicationDefinition.view((model, h) => ({
  title: 'Invalid application fixture',
  body: h.main([], [globalThis.String(model.child.value)]),
}))

const provisionPageAwaitingDependency = makeProvisionPageAwaitingDependency(
  document.createElement('div'),
)

// @ts-expect-error The first provider carries its still-missing dependency forward.
Runtime.hydrate(provisionPageAwaitingDependency)

const provisionElement = makeProvisionElement(document.createElement('div'))

// @ts-expect-error Provision preserves Element kind, which cannot be hydrated as a page.
Runtime.hydrate(provisionElement)

const DeclarationProvisionContract = Command.define(
  'DeclarationProvisionContract',
  {
    args: { value: Schema.String },
    messages: [ParentMessage.RequestedRefresh],
    handler: function* () {
      return () => Effect.succeed(ParentMessage.RequestedRefresh())
    },
  },
)

// eslint-disable-next-line foldkit/command-binding-matches-name
const ConflictingProvisionContract = Command.define(
  'DeclarationProvisionContract',
  {
    args: { value: Schema.optional(Schema.String) },
    messages: [ParentMessage.RequestedRefresh],
    handler: function* () {
      return () => Effect.succeed(ParentMessage.RequestedRefresh())
    },
  },
)

class ProvisionContractConsumer extends Context.Service<
  ProvisionContractConsumer,
  Readonly<{ value: string }>
>()('DeclarationTestsProvisionContractConsumer') {}

const RequiresConflictingProvisionContract = Layer.effect(
  ProvisionContractConsumer,
  Effect.as(ConflictingProvisionContract({ value: 'input' }).effect, {
    value: 'ready',
  }),
)

const provisionContractProgram = InvalidApplicationDefinition.makeElement({
  ...invalidApplicationImplementation,
  container: null,
  view: invalidElementView,
})
const programWithProvisionContract = provisionContractProgram.provide(
  DeclarationProvisionContract.layer,
)

// @ts-expect-error A later provider cannot output a conflicting handler contract.
programWithProvisionContract.provide(ConflictingProvisionContract.layer)

// @ts-expect-error A later provider cannot require a conflicting handler contract.
programWithProvisionContract.provide(RequiresConflictingProvisionContract)

// @ts-expect-error Page Applications require a Document view.
InvalidApplicationDefinition.make({
  ...invalidApplicationImplementation,
  container: null,
  view: invalidElementView,
})

// @ts-expect-error Element Applications require an HTML view.
InvalidApplicationDefinition.makeElement({
  ...invalidApplicationImplementation,
  container: null,
  view: invalidDocumentView,
})

const requiredContextUpdate = InvalidApplicationDefinition.update(
  (model, _message, requiredContext: string) => {
    void requiredContext
    return { model }
  },
)

// @ts-expect-error Application update cannot require root dispatch context.
InvalidApplicationDefinition.makeElement({
  ...invalidApplicationImplementation,
  update: requiredContextUpdate,
  container: null,
  view: invalidElementView,
})

const WiderMessage = defineMessageUnion({
  // eslint-disable-next-line foldkit/got-prefix-requires-block-payload
  GotChildMessage: { message: ChildMessage },
  RequestedRefresh: {},
  RequestedExtraWork: {},
})
const WiderMessageApplicationDefinition = (() => {
  const ApplicationDefinition = defineApplication({
    Model: ParentModel,
    Message: WiderMessage,
  })

  return ApplicationDefinition
})()
const widerMessageUpdate = WiderMessageApplicationDefinition.update(
  (model, _message): Update.Return<ParentModel, ParentMessage> => ({ model }),
)

// @ts-expect-error Application update must accept exactly the root Message.
InvalidApplicationDefinition.makeElement({
  ...invalidApplicationImplementation,
  update: widerMessageUpdate,
  container: null,
  view: invalidElementView,
})

const WiderInputModel = Schema.Struct({})
const WiderInputModelApplicationDefinition = (() => {
  const ApplicationDefinition = defineApplication({
    Model: WiderInputModel,
    Message: ParentMessage,
  })

  return ApplicationDefinition
})()
const widerModelUpdate = WiderInputModelApplicationDefinition.update(
  (_model, _message): Update.Return<ParentModel, ParentMessage> => ({
    model: ParentModel.make({ child: Child.Model.make({ value: 0 }) }),
  }),
)

// @ts-expect-error Application update must accept exactly the root Model.
InvalidApplicationDefinition.makeElement({
  ...invalidApplicationImplementation,
  update: widerModelUpdate,
  container: null,
  view: invalidElementView,
})

// oxlint-disable-next-line effecttsgo/floating-effect
Server.renderToString(
  InvalidApplicationDefinition,
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

const DeclarationTestsConstructorDefinition = Block.define(
  'DeclarationTestsConstructor',
)
const ConstructorMessage = defineMessageUnion({ CompletedWork: {} })
const ForeignPrimitiveMessage = defineMessageUnion({ ForeignCompleted: {} })

const DeclarationTestsTypedPrimitiveOwnerDefinition = Block.define(
  'DeclarationTestsTypedPrimitiveOwner',
  {
    Model: ParentModel,
    Message: ParentMessage,
  },
)

DeclarationTestsTypedPrimitiveOwnerDefinition.command('ForeignCommand', {
  // @ts-expect-error A typed Block Command must produce its owner's Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})
DeclarationTestsTypedPrimitiveOwnerDefinition.mount('ForeignMount', {
  // @ts-expect-error A typed Block Mount must produce its owner's Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})
DeclarationTestsTypedPrimitiveOwnerDefinition.mountStream(
  'ForeignMountStream',
  {
    // @ts-expect-error A typed Block stream Mount must produce its owner's Message.
    messages: [ForeignPrimitiveMessage.ForeignCompleted],
  },
)

const TypedPrimitiveApplicationDefinition = (() => {
  const ApplicationDefinition = defineApplication({
    Model: ParentModel,
    Message: ParentMessage,
  })

  return ApplicationDefinition
})()

TypedPrimitiveApplicationDefinition.command('ForeignApplicationCommand', {
  // @ts-expect-error A root Command must produce the Application Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})
TypedPrimitiveApplicationDefinition.mount('ForeignApplicationMount', {
  // @ts-expect-error A root Mount must produce the Application Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})
TypedPrimitiveApplicationDefinition.mountStream(
  'ForeignApplicationMountStream',
  {
    // @ts-expect-error A root stream Mount must produce the Application Message.
    messages: [ForeignPrimitiveMessage.ForeignCompleted],
  },
)

// @ts-expect-error Owned primitive names cannot contain a scoped identity separator.
DeclarationTestsConstructorDefinition.command('Invalid::Work', {
  messages: [ConstructorMessage.CompletedWork],
})

const HostWork = DeclarationTestsConstructorDefinition.command('HostWork', {
  messages: [ConstructorMessage.CompletedWork],
})

DeclarationTestsConstructorDefinition.command('InvalidConstructedWork', {
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
  // eslint-disable-next-line foldkit/got-prefix-requires-block-payload
  GotChildMessage: { message: ChildMessage, requestId: Schema.String },
})
const WrongChildParentMessage = defineMessageUnion({
  // eslint-disable-next-line foldkit/got-prefix-requires-block-payload
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

const DeclarationTestsInvalidParentDefinition = Block.define(
  'DeclarationTestsInvalidParent',
).define({
  Model: ParentModel,
  Message: ParentMessage,
})
// @ts-expect-error Registered child bindings must use the definition's parent Message.
DeclarationTestsInvalidParentDefinition.register({
  children: [foreignChild],
})

const DeclarationTestsOmittedChildDefinition = Block.define(
  'DeclarationTestsOmittedChild',
).define({
  Model: ParentModel,
  Message: ParentMessage,
})

Block.define('DeclarationTestsInvalidDirectContracts', {
  Model: ParentModel,
  Message: ParentMessage,
  // @ts-expect-error Graph registrations belong to the register stage.
  children: [child],
})

const omittedChildUpdate = DeclarationTestsOmittedChildDefinition.update(
  (model, message) =>
    ParentMessage.match(message, {
      GotChildMessage: ({ message }) => child.fold(model, message),
      RequestedRefresh: () => ({ model }),
    }),
)

DeclarationTestsOmittedChildDefinition.toBlock({
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
const completedRefinedChoice: CompletedChoice<readonly ['One', 'Two']> =
  RefinedChoice

// @ts-expect-error Direct exposed operations retain their refined input after completion.
completedRefinedChoice.expose.finish(refinedModel, 'Three')

// @ts-expect-error A named completion preserves the exact Block contract.
const invalidCompletedChild: CompletedChild = Direct
void invalidCompletedChild

// @ts-expect-error Connection lifecycle metadata is available through Block.inspectConnection.
child.subscriptions
// @ts-expect-error Connection resource metadata is available through Block.inspectConnection.
child.managedResources
// @ts-expect-error Connection Mount metadata is available through Block.inspectConnection.
child.mounts
// @ts-expect-error Connection Layer metadata is available through Block.inspectConnection.
child.EffectsLayer
// @ts-expect-error Internal connection evidence is not a string member.
child.__blockBindingBlock
// @ts-expect-error Internal handler evidence is not a string member.
child.__blockHandlerRequirements

const DeclarationTestsInvalidViewDefinition = Block.define(
  'DeclarationTestsInvalidView',
).define({
  Model: ParentModel,
  Message: ParentMessage,
})
const RegisteredDeclarationTestsInvalidViewDefinition =
  DeclarationTestsInvalidViewDefinition.register({ children: [child] })

RegisteredDeclarationTestsInvalidViewDefinition.view((model, h) => {
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
