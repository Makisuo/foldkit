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

const DeclarationTestsRenderDefinition = Block.define(
  'DeclarationTestsRender',
  {
    Model: ParentModel,
    Message: ParentMessage,
  },
)
const ObserveRender = DeclarationTestsRenderDefinition.mount('ObserveRender', {
  messages: [ParentMessage.RequestedRefresh],
})
const RenderComposition = DeclarationTestsRenderDefinition.toComposition()
const renderOnly = RenderComposition.render((model, h) =>
  h.main([], [globalThis.String(model.child.value)]),
)

RenderComposition.render((model, h) =>
  h.block(
    // @ts-expect-error An extracted render helper cannot use a child absent from its Composition.
    child.embedView({ slotId: 'omitted-child', model: model.child }),
  ),
)

RenderComposition.render((_model, h) =>
  h.main([
    // @ts-expect-error An extracted render helper cannot use a Mount absent from its Composition.
    h.OnMount(ObserveRender()),
  ]),
)

const ForeignRenderMessage = defineMessageUnion({ ClickedForeignRender: {} })

RenderComposition.render((_model, h) =>
  h.button([
    // @ts-expect-error An extracted render helper accepts only its Composition's Message.
    h.OnClick(ForeignRenderMessage.ClickedForeignRender()),
  ]),
)

// @ts-expect-error A domain render helper requires a concrete input type.
RenderComposition.render.withInput()((_input, h) => h.empty)

RenderComposition.toBlock({
  init: invalidApplicationImplementation.init,
  update: DeclarationTestsRenderDefinition.update(model => ({ model })),
  // @ts-expect-error A plain render helper cannot complete a Block as its branded view.
  view: renderOnly,
  EffectsLayer: Layer.empty,
})

const InvalidApplicationComposition =
  InvalidApplicationDefinition.toComposition()
const applicationRenderOnly = InvalidApplicationComposition.render((model, h) =>
  h.main([], [globalThis.String(model.child.value)]),
)

// @ts-expect-error A plain render helper cannot complete an Application as its branded view.
InvalidApplicationComposition.makeElement({
  ...invalidApplicationImplementation,
  container: null,
  view: applicationRenderOnly,
})

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

const provisionContractProgram = InvalidApplicationComposition.makeElement({
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
InvalidApplicationComposition.make({
  ...invalidApplicationImplementation,
  container: null,
  view: invalidElementView,
})

// @ts-expect-error Element Applications require an HTML view.
InvalidApplicationComposition.makeElement({
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
InvalidApplicationComposition.makeElement({
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
InvalidApplicationComposition.makeElement({
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
InvalidApplicationComposition.makeElement({
  ...invalidApplicationImplementation,
  update: widerModelUpdate,
  container: null,
  view: invalidElementView,
})

// oxlint-disable-next-line effecttsgo/floating-effect
Server.renderToString(
  InvalidApplicationComposition,
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

const ForeignParentDefinition = Block.define('DeclarationTestsForeignParent', {
  Model: ParentModel,
  Message: ForeignParentMessage,
})
const foreignChild = ForeignParentDefinition.bindChild(Child, {
  placement: 'foreign-child',
  read: model => Option.some(model.child),
  write: (_model, nextChild) => ParentModel.make({ child: nextChild }),
  toParentMessage: () => ForeignParentMessage.ReceivedChildMessage(),
})

const BindingParentDefinition = Block.define('DeclarationTestsBindingParent', {
  Model: ParentModel,
  Message: ParentMessage,
})

BindingParentDefinition.bindChild(Child, {
  field: 'child',
  // @ts-expect-error A parent Message constructor is exclusive with a custom mapper.
  parentMessage: ParentMessage.GotChildMessage,
  toParentMessage: (message: ChildMessage) =>
    ParentMessage.GotChildMessage({ message }),
})

const WrongChildParentDefinition = Block.define(
  'DeclarationTestsWrongChildParent',
  { Model: ParentModel, Message: WrongChildParentMessage },
)
WrongChildParentDefinition.bindChild(Child, {
  field: 'child',
  // @ts-expect-error A parent Message constructor must accept this Block's Message.
  parentMessage: WrongChildParentMessage.GotChildMessage,
})

const ExtraParentDefinition = Block.define('DeclarationTestsExtraParent', {
  Model: ParentModel,
  Message: ExtraParentMessage,
})
ExtraParentDefinition.bindChild(Child, {
  field: 'child',
  // @ts-expect-error A parent Message constructor cannot require fields beyond the child Message.
  parentMessage: ExtraParentMessage.GotChildMessage,
})

BindingParentDefinition.bindChild(Child, {
  // @ts-expect-error Keyed Bindings do not accept the static parentMessage shorthand.
  placement: 'children',
  readAll: (model: ParentModel) => [model.child],
  key: (): 'only' => 'only',
  // @ts-expect-error The invalid static mapper prevents keyed overload selection.
  read: (childModel: ChildModel) => childModel,
  writeAt: (_model: ParentModel, _key: 'only', nextChild: ChildModel) =>
    ParentModel.make({ child: nextChild }),
  // @ts-expect-error The invalid static mapper prevents keyed overload selection.
  toParentMessage: (_key: 'only', message: ChildMessage) =>
    ParentMessage.GotChildMessage({ message }),
  // @ts-expect-error Keyed Bindings do not accept the static parentMessage shorthand.
  parentMessage: ParentMessage.GotChildMessage,
})

const DeclarationTestsInvalidParentDefinition = Block.define(
  'DeclarationTestsInvalidParent',
).define({
  Model: ParentModel,
  Message: ParentMessage,
})
// @ts-expect-error Registered child bindings must use the definition's parent Message.
DeclarationTestsInvalidParentDefinition.toComposition({
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
  // @ts-expect-error Graph registrations belong to the Composition stage.
  children: [child],
})

const omittedChildUpdate = DeclarationTestsOmittedChildDefinition.update(
  (model, message) =>
    ParentMessage.match(message, {
      GotChildMessage: ({ message }) => child.fold(model, message),
      RequestedRefresh: () => ({ model }),
    }),
)

DeclarationTestsOmittedChildDefinition.toComposition().toBlock({
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

// @ts-expect-error Binding lifecycle metadata is available through Block.inspectBinding.
child.subscriptions
// @ts-expect-error Binding resource metadata is available through Block.inspectBinding.
child.managedResources
// @ts-expect-error Binding Mount metadata is available through Block.inspectBinding.
child.mounts
// @ts-expect-error Binding Layer metadata is available through Block.inspectBinding.
child.EffectsLayer
// @ts-expect-error Internal Binding evidence is not a string member.
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
  DeclarationTestsInvalidViewDefinition.toComposition({ children: [child] })

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
