import { Context, Effect, Layer, Option, Schema } from 'effect'
import { defineApplication } from 'foldkit'
import * as Block from 'foldkit/block'
import * as Command from 'foldkit/command'
import { Server } from 'foldkit/experimental'
import { defineMessageUnion } from 'foldkit/message'
import * as Runtime from 'foldkit/runtime'
import * as Update from 'foldkit/update'

import {
  ChildBlock,
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

const InvalidApplication = (() => {
  const Application = defineApplication({
    Model: ParentModel,
    Message: ParentMessage,
  })

  return Application
})()
const InvalidApplicationComposition = InvalidApplication.toComposition()
type InvalidApplicationViewBuilder = Block.HtmlBuilderOf<
  typeof InvalidApplicationComposition
>
const invalidApplicationImplementation = {
  init: () => ({
    model: ParentModel.make({ child: ChildBlock.Model.make({ value: 0 }) }),
  }),
  update: InvalidApplication.update(model => ({ model })),
  EffectsLayer: Layer.empty,
}
const invalidElementView = InvalidApplicationComposition.view((model, h) =>
  h.main([], [globalThis.String(model.child.value)]),
)
const invalidDocumentView = InvalidApplicationComposition.view((model, h) => ({
  title: 'Invalid application fixture',
  body: h.main([], [globalThis.String(model.child.value)]),
}))

// @ts-expect-error An Application Definition does not author the primary view.
InvalidApplication.view

const DeclarationTestsViewHelper = Block.define('DeclarationTestsViewHelper', {
  Model: ParentModel,
  Message: ParentMessage,
})
const ObserveViewHelper = DeclarationTestsViewHelper.mount(
  'ObserveViewHelper',
  {
    messages: [ParentMessage.RequestedRefresh],
  },
)
const ViewHelperComposition = DeclarationTestsViewHelper.toComposition()
type ViewHelperViewBuilder = Block.HtmlBuilderOf<typeof ViewHelperComposition>
const viewHelper = (model: ParentModel, h: ViewHelperViewBuilder) =>
  h.main([], [globalThis.String(model.child.value)])

const viewHelperWithOmittedChild = (
  model: ParentModel,
  h: ViewHelperViewBuilder,
) =>
  h.block(
    // @ts-expect-error An extracted view helper cannot use a child absent from its Composition.
    child.embedView({ slotId: 'omitted-child', model: model.child }),
  )

const viewHelperWithOmittedMount = (h: ViewHelperViewBuilder) =>
  h.main([
    // @ts-expect-error An extracted view helper cannot use a Mount absent from its Composition.
    h.OnMount(ObserveViewHelper()),
  ])

const ForeignViewHelperMessage = defineMessageUnion({
  ClickedForeignViewHelper: {},
})

// @ts-expect-error A Block Definition does not author the primary view.
DeclarationTestsViewHelper.view

ViewHelperComposition.view((_model, h) =>
  h.main([
    // @ts-expect-error A Composition view cannot use an unregistered Mount.
    h.OnMount(ObserveViewHelper()),
  ]),
)

ViewHelperComposition.view((_model, h) =>
  h.button([
    // @ts-expect-error A Composition view preserves its exact Message.
    h.OnClick(ForeignViewHelperMessage.ClickedForeignViewHelper()),
  ]),
)

// @ts-expect-error void cannot describe usable per-render ViewInputs.
ViewHelperComposition.view.withInputs<void>((_model, _inputs, h) => h.empty)

// @ts-expect-error any cannot erase a Composition's ViewInputs contract.
ViewHelperComposition.view.withInputs<any>((_model, _inputs, h) => h.empty)

const viewHelperWithForeignMessage = (h: ViewHelperViewBuilder) =>
  h.button([
    // @ts-expect-error An extracted view helper accepts only its Composition's Message.
    h.OnClick(ForeignViewHelperMessage.ClickedForeignViewHelper()),
  ])

// @ts-expect-error Composition no longer carries a render helper.
ViewHelperComposition.render

ViewHelperComposition.toBlock({
  init: invalidApplicationImplementation.init,
  update: DeclarationTestsViewHelper.update(model => ({ model })),
  // @ts-expect-error A plain view helper cannot complete a Block as its branded view.
  view: viewHelper,
  EffectsLayer: Layer.empty,
})

const applicationViewHelper = (
  model: ParentModel,
  h: InvalidApplicationViewBuilder,
) => h.main([], [globalThis.String(model.child.value)])

const applicationInputView = InvalidApplicationComposition.view.withInputs<
  Readonly<{ label: string }>
>((_model, { label }, h) => h.main([], [label]))

// @ts-expect-error An Application's primary view cannot require parent-supplied inputs.
InvalidApplicationComposition.toElement({
  ...invalidApplicationImplementation,
  container: null,
  view: applicationInputView,
})

// @ts-expect-error Application Composition no longer carries a render helper.
InvalidApplicationComposition.render

// @ts-expect-error A plain view helper cannot complete an Application as its branded view.
InvalidApplicationComposition.toElement({
  ...invalidApplicationImplementation,
  container: null,
  view: applicationViewHelper,
})

void viewHelperWithOmittedChild
void viewHelperWithOmittedMount
void viewHelperWithForeignMessage

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

const provisionContractProgram = InvalidApplicationComposition.toElement({
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
InvalidApplicationComposition.toApplication({
  ...invalidApplicationImplementation,
  container: null,
  view: invalidElementView,
})

// @ts-expect-error Element Applications require an HTML view.
InvalidApplicationComposition.toElement({
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
InvalidApplicationComposition.toElement({
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
const WiderMessageApplication = (() => {
  const Application = defineApplication({
    Model: ParentModel,
    Message: WiderMessage,
  })

  return Application
})()
const widerMessageUpdate = WiderMessageApplication.update(
  (model, _message): Update.Return<ParentModel, ParentMessage> => ({ model }),
)

// @ts-expect-error Application update must accept exactly the root Message.
InvalidApplicationComposition.toElement({
  ...invalidApplicationImplementation,
  update: widerMessageUpdate,
  container: null,
  view: invalidElementView,
})

const WiderInputModel = Schema.Struct({})
const WiderInputModelApplication = (() => {
  const Application = defineApplication({
    Model: WiderInputModel,
    Message: ParentMessage,
  })

  return Application
})()
const widerModelUpdate = WiderInputModelApplication.update(
  (_model, _message): Update.Return<ParentModel, ParentMessage> => ({
    model: ParentModel.make({ child: ChildBlock.Model.make({ value: 0 }) }),
  }),
)

// @ts-expect-error Application update must accept exactly the root Model.
InvalidApplicationComposition.toElement({
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

const DeclarationTestsConstructor = Block.define('DeclarationTestsConstructor')
const ConstructorMessage = defineMessageUnion({ CompletedWork: {} })
const ForeignPrimitiveMessage = defineMessageUnion({ ForeignCompleted: {} })

const DeclarationTestsTypedPrimitiveOwner = Block.define(
  'DeclarationTestsTypedPrimitiveOwner',
  {
    Model: ParentModel,
    Message: ParentMessage,
  },
)

DeclarationTestsTypedPrimitiveOwner.command('ForeignCommand', {
  // @ts-expect-error A typed Block Command must produce its owner's Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})
DeclarationTestsTypedPrimitiveOwner.mount('ForeignMount', {
  // @ts-expect-error A typed Block Mount must produce its owner's Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})
DeclarationTestsTypedPrimitiveOwner.mountStream('ForeignMountStream', {
  // @ts-expect-error A typed Block stream Mount must produce its owner's Message.
  messages: [ForeignPrimitiveMessage.ForeignCompleted],
})

const TypedPrimitiveApplication = (() => {
  const Application = defineApplication({
    Model: ParentModel,
    Message: ParentMessage,
  })

  return Application
})()

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
DeclarationTestsConstructor.command('Invalid::Work', {
  messages: [ConstructorMessage.CompletedWork],
})

const HostWork = DeclarationTestsConstructor.command('HostWork', {
  messages: [ConstructorMessage.CompletedWork],
})

DeclarationTestsConstructor.command('InvalidConstructedWork', {
  messages: [ConstructorMessage.CompletedWork],
  // @ts-expect-error Foldkit handlers are unavailable while another handler is constructed.
  handler: function* () {
    yield* HostWork().effect

    return () => Effect.succeed(ConstructorMessage.CompletedWork())
  },
})

// @ts-expect-error A replacement Layer must preserve the Block's exact handler outputs.
ChildBlock.replaceEffectsLayer(Layer.empty)

const ForeignParentMessage = defineMessageUnion({ ReceivedChildMessage: {} })
const ExtraParentMessage = defineMessageUnion({
  // eslint-disable-next-line foldkit/got-prefix-requires-block-payload
  GotChildMessage: { message: ChildMessage, requestId: Schema.String },
})
const WrongChildParentMessage = defineMessageUnion({
  // eslint-disable-next-line foldkit/got-prefix-requires-block-payload
  GotChildMessage: { message: Schema.String },
})

const ForeignParent = Block.define('DeclarationTestsForeignParent', {
  Model: ParentModel,
  Message: ForeignParentMessage,
})
const foreignChild = ForeignParent.bindChild(ChildBlock, {
  placement: 'foreign-child',
  read: model => Option.some(model.child),
  write: (_model, nextChild) => ParentModel.make({ child: nextChild }),
  toParentMessage: () => ForeignParentMessage.ReceivedChildMessage(),
})

const BindingParent = Block.define('DeclarationTestsBindingParent', {
  Model: ParentModel,
  Message: ParentMessage,
})

BindingParent.bindChild(ChildBlock, {
  // @ts-expect-error Invalid Message mapping prevents the direct overload.
  field: 'child',
  // @ts-expect-error A parent Message constructor is exclusive with a custom mapper.
  parentMessage: ParentMessage.GotChildMessage,
  // @ts-expect-error A parent Message constructor is exclusive with a custom mapper.
  toParentMessage: (message: ChildMessage) =>
    ParentMessage.GotChildMessage({ message }),
})

const WrongChildParent = Block.define('DeclarationTestsWrongChildParent', {
  Model: ParentModel,
  Message: WrongChildParentMessage,
})
WrongChildParent.bindChild(ChildBlock, {
  // @ts-expect-error Invalid Message mapping prevents the direct overload.
  field: 'child',
  // @ts-expect-error A parent Message constructor must accept this Block's Message.
  parentMessage: WrongChildParentMessage.GotChildMessage,
})

const ExtraParent = Block.define('DeclarationTestsExtraParent', {
  Model: ParentModel,
  Message: ExtraParentMessage,
})
ExtraParent.bindChild(ChildBlock, {
  // @ts-expect-error Invalid Message mapping prevents the direct overload.
  field: 'child',
  // @ts-expect-error A parent Message constructor cannot require fields beyond the child Message.
  parentMessage: ExtraParentMessage.GotChildMessage,
})

BindingParent.bindChild(ChildBlock, {
  placement: 'children',
  readAll: (model: ParentModel) => [model.child],
  key: (): 'only' => 'only',
  read: (childModel: ChildModel) => childModel,
  writeAt: (_model: ParentModel, _key: 'only', nextChild: ChildModel) =>
    ParentModel.make({ child: nextChild }),
  toParentMessage: (_key: 'only', message: ChildMessage) =>
    ParentMessage.GotChildMessage({ message }),
  // @ts-expect-error Keyed Bindings do not accept the static parentMessage shorthand.
  parentMessage: ParentMessage.GotChildMessage,
})

const DeclarationTestsInvalidParent = Block.define(
  'DeclarationTestsInvalidParent',
).define({
  Model: ParentModel,
  Message: ParentMessage,
})
// @ts-expect-error Registered child bindings must use the definition's parent Message.
DeclarationTestsInvalidParent.toComposition({
  children: [foreignChild],
})

const DeclarationTestsOmittedChild = Block.define(
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

const omittedChildUpdate = DeclarationTestsOmittedChild.update(
  (model, message) =>
    ParentMessage.match(message, {
      GotChildMessage: ({ message }) => child.fold(model, message),
      RequestedRefresh: () => ({ model }),
    }),
)

DeclarationTestsOmittedChild.toComposition().toBlock({
  init: () => ({
    model: ParentModel.make({ child: ChildBlock.Model.make({ value: 0 }) }),
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
      model: ParentModel.make({ child: ChildBlock.Model.make({ value: 0 }) }),
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

const DeclarationTestsInvalidView = Block.define(
  'DeclarationTestsInvalidView',
).define({
  Model: ParentModel,
  Message: ParentMessage,
})
const DeclarationTestsInvalidViewComposition =
  DeclarationTestsInvalidView.toComposition({ children: [child] })

DeclarationTestsInvalidViewComposition.view((model, h) => {
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
