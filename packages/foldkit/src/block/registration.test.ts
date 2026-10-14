import { Array, Layer, Option, Schema, Stream } from 'effect'
import { expect, expectTypeOf, it } from 'vitest'

import * as Command from '../command/index.js'
import { defineMessageUnion } from '../message/index.js'
import * as Update from '../update/index.js'
import type { BindingRequirement } from './binding.js'
import { define } from './define.js'

const ChildModel = Schema.Struct({ count: Schema.Number })
type ChildModel = typeof ChildModel.Type

const Message = defineMessageUnion({ Advanced: {}, Ignored: {} })
type Message = typeof Message.Type

const ChildOwner = define('RegistrationChild')
const childDefinition = ChildOwner.define({ Model: ChildModel, Message })
const reset = childDefinition.step((_model: ChildModel) => ({
  model: ChildModel.make({ count: 0 }),
}))
const Child = childDefinition.toBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: childDefinition.update(model => ({
    model: ChildModel.make({ count: model.count + 1 }),
  })),
  expose: { reset },
  EffectsLayer: Layer.empty,
})

const ParentModel = Schema.Struct({
  child: ChildModel,
  children: Schema.Array(ChildModel),
})
type ParentModel = typeof ParentModel.Type

const makeParentModel = (child: ChildModel): ParentModel =>
  ParentModel.make({ child, children: [] })

const child = Child.connection({
  placement: 'child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
})

const registeredParentBase = define('RegisteredPureChildParent').define({
  Model: ParentModel,
  Message,
})
const RegisteredParent = registeredParentBase.register({ children: [child] })
const OmittedParent = define('OmittedPureChildParent').define({
  Model: ParentModel,
  Message,
})

const registeredFold = RegisteredParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel, message: Message) => child.fold(model, message),
  EffectsLayer: Layer.empty,
})
const omittedFold = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel, message: Message) => child.fold(model, message),
  // @ts-expect-error A pure fold may use only a registered child binding.
  EffectsLayer: Layer.empty,
})

const registeredStep = RegisteredParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => child.reset()(model),
  EffectsLayer: Layer.empty,
})
const omittedStep = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => child.reset()(model),
  // @ts-expect-error A pure Step may use only a registered child binding.
  EffectsLayer: Layer.empty,
})

const registeredCombinedStep = RegisteredParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => Update.combine(model, [child.reset()]),
  EffectsLayer: Layer.empty,
})
const omittedCombinedStep = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => Update.combine(model, [child.reset()]),
  // @ts-expect-error combine preserves the registration of every child Step.
  EffectsLayer: Layer.empty,
})

const dynamicChildSteps = Array.map([child.reset()], step => step)
const registeredDynamicCombinedStep = RegisteredParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => Update.combine(model, dynamicChildSteps),
  EffectsLayer: Layer.empty,
})
const omittedDynamicCombinedStep = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => Update.combine(model, dynamicChildSteps),
  // @ts-expect-error A computed Step list retains its child registration.
  EffectsLayer: Layer.empty,
})

const registeredInit = RegisteredParent.toBlock({
  init: () => {
    const childInit = child.init()
    return {
      model: makeParentModel(childInit.model),
      commands: childInit.commands,
    }
  },
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedInit = OmittedParent.toBlock({
  init: () => {
    const childInit = child.init()
    return {
      model: makeParentModel(childInit.model),
      commands: childInit.commands,
    }
  },
  update: (model: ParentModel) => ({ model }),
  // @ts-expect-error Forwarded init Commands retain their child registration.
  EffectsLayer: Layer.empty,
})

const registeredDefinedUpdate = registeredParentBase.update(
  (model: ParentModel, message: Message) => child.fold(model, message),
)
const registeredDefinitionUpdate = RegisteredParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: registeredDefinedUpdate,
  EffectsLayer: Layer.empty,
})
const omittedDefinedUpdate = OmittedParent.update(
  (model: ParentModel, message: Message) => child.fold(model, message),
)
const omittedDefinitionUpdate = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: omittedDefinedUpdate,
  // @ts-expect-error A defined update preserves the binding used by its result.
  EffectsLayer: Layer.empty,
})

const genericUpdate = Update.define((model: ParentModel, message: Message) =>
  child.fold(model, message),
)
const registeredGenericUpdate = RegisteredParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: genericUpdate,
  EffectsLayer: Layer.empty,
})
const omittedGenericUpdate = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: genericUpdate,
  // @ts-expect-error Update.define preserves the binding used by its result.
  EffectsLayer: Layer.empty,
})

const branchUpdate = Update.define((model: ParentModel, message: Message) =>
  message._tag === 'Advanced' ? child.reset()(model) : { model },
)
const registeredBranchUpdate = RegisteredParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: branchUpdate,
  EffectsLayer: Layer.empty,
})
const omittedBranchUpdate = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: branchUpdate,
  // @ts-expect-error A union return retains registration from its child branch.
  EffectsLayer: Layer.empty,
})

const explicitlyAnnotatedUpdate = (model: ParentModel, message: Message) =>
  Message.match<Update.Return<ParentModel, Message>>(message, {
    // @ts-expect-error An explicit Return cannot erase child registration evidence.
    Advanced: () => {
      return child.reset()(model)
    },
    Ignored: () => ({ model }),
  })

const explicitlyAnnotatedCallback = (
  model: ParentModel,
): Update.Return<ParentModel, Message> => {
  // @ts-expect-error An explicit callback return cannot erase child registration evidence.
  return child.reset()(model)
}

const mappedChildInit = () => {
  const childInit = child.init()
  return {
    model: makeParentModel(childInit.model),
    commands: Command.mapMessages(childInit.commands, message => message),
  }
}
const registeredMappedInit = RegisteredParent.toBlock({
  init: mappedChildInit,
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedMappedInit = OmittedParent.toBlock({
  init: mappedChildInit,
  update: (model: ParentModel) => ({ model }),
  // @ts-expect-error mapMessages preserves child registration on the collection.
  EffectsLayer: Layer.empty,
})

const foldedChildInit = () =>
  Update.foldChildInit(child.init(), {
    toParentModel: makeParentModel,
    toParentMessage: (message: Message) => message,
  })
const registeredFoldedChildInit = RegisteredParent.toBlock({
  init: foldedChildInit,
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedFoldedChildInit = OmittedParent.toBlock({
  init: foldedChildInit,
  update: (model: ParentModel) => ({ model }),
  // @ts-expect-error foldChildInit preserves its child's registration.
  EffectsLayer: Layer.empty,
})

const foldedChildInits = () =>
  Update.foldChildInits(
    { child: child.init() },
    {
      toParentModel: ({ child: childModel }) => makeParentModel(childModel),
      folds: {
        child: { toParentMessage: (message: Message) => message },
      },
    },
  )
const registeredFoldedChildInits = RegisteredParent.toBlock({
  init: foldedChildInits,
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedFoldedChildInits = OmittedParent.toBlock({
  init: foldedChildInits,
  update: (model: ParentModel) => ({ model }),
  // @ts-expect-error foldChildInits preserves every child's registration.
  EffectsLayer: Layer.empty,
})

const modelOnlyChildInit = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(child.init().model) }),
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})

const unusedChildParentBase = define('UnusedRegisteredChildParent').define({
  Model: ParentModel,
  Message,
})
const UnusedChildParent = unusedChildParentBase.register({ children: [child] })
const RemovedUnusedChildParent = define('RemovedUnusedChildParent').define({
  Model: ParentModel,
  Message,
})
const unusedChild = UnusedChildParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})
const removedUnusedChild = RemovedUnusedChildParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})

const children = Child.keyedConnection({
  placement: 'children',
  readAll: (model: ParentModel) => model.children,
  key: childModel => childModel.count,
  read: childModel => childModel,
  writeAt: (model, key, nextChild) =>
    ParentModel.make({
      ...model,
      children: model.children.map(childModel =>
        childModel.count === key ? nextChild : childModel,
      ),
    }),
  toParentMessage: (_key, message: Message) => message,
})

const registeredKeyedParentBase = define(
  'RegisteredPureKeyedChildParent',
).define({
  Model: ParentModel,
  Message,
})
const RegisteredKeyedParent = registeredKeyedParentBase.register({
  children: [children],
})
const OmittedKeyedParent = define('OmittedPureKeyedChildParent').define({
  Model: ParentModel,
  Message,
})

const registeredKeyedFold = RegisteredKeyedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel, message: Message) =>
    children.fold(model, 0, message),
  EffectsLayer: Layer.empty,
})
const omittedKeyedFold = OmittedKeyedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel, message: Message) =>
    children.fold(model, 0, message),
  // @ts-expect-error A keyed pure fold requires its registered collection.
  EffectsLayer: Layer.empty,
})

const registeredKeyedStep = RegisteredKeyedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => children.reset(0)(model),
  EffectsLayer: Layer.empty,
})
const omittedKeyedStep = OmittedKeyedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => children.reset(0)(model),
  // @ts-expect-error A keyed pure Step requires its registered collection.
  EffectsLayer: Layer.empty,
})

const registeredKeyedCombinedStep = RegisteredKeyedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => Update.combine(model, [children.reset(0)]),
  EffectsLayer: Layer.empty,
})
const omittedKeyedCombinedStep = OmittedKeyedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => Update.combine(model, [children.reset(0)]),
  // @ts-expect-error combine preserves a keyed child Step's registration.
  EffectsLayer: Layer.empty,
})

const registeredKeyedInit = RegisteredKeyedParent.toBlock({
  init: () => {
    const childInit = children.init(0)
    return {
      model: makeParentModel(childInit.model),
      commands: childInit.commands,
    }
  },
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedKeyedInit = OmittedKeyedParent.toBlock({
  init: () => {
    const childInit = children.init(0)
    return {
      model: makeParentModel(childInit.model),
      commands: childInit.commands,
    }
  },
  update: (model: ParentModel) => ({ model }),
  // @ts-expect-error Keyed init Commands retain their collection registration.
  EffectsLayer: Layer.empty,
})

const PolicyOutMessage = defineMessageUnion({ RequestedSecondaryReset: {} })
type PolicyOutMessage = typeof PolicyOutMessage.Type

const policyChildDefinition = define('RegistrationPolicyChild').define({
  Model: ChildModel,
  Message,
  OutMessage: PolicyOutMessage,
})
const PolicyChild = policyChildDefinition.toBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: (model: ChildModel) => ({
    model,
    outMessage: PolicyOutMessage.RequestedSecondaryReset(),
  }),
  EffectsLayer: Layer.empty,
})

const secondaryChild = Child.connection({
  placement: 'secondary-child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
})
const unsupportedNestedRawChildStep = Update.foldChildStep({
  // @ts-expect-error A raw child fold cannot erase a binding operation's registration.
  update: (model: ParentModel) => secondaryChild.reset()(model),
  read: (model: ParentModel) => Option.some(model),
  write: (_model, nextModel) => nextModel,
  toParentMessage: (message: Message) => message,
})
const policyChild = PolicyChild.connection({
  placement: 'policy-child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
  outMessage: {
    fold: (_outMessage: PolicyOutMessage) => (model: ParentModel) =>
      Update.combine(model, [secondaryChild.reset()]),
  },
})

const policyParentBase = define('RegisteredPolicyParent').define({
  Model: ParentModel,
  Message,
})
const RegisteredPolicyParent = policyParentBase.register({
  children: [policyChild, secondaryChild],
})
const omittedPolicyParentBase = define('OmittedPolicyParent').define({
  Model: ParentModel,
  Message,
})
const OmittedPolicyParent = omittedPolicyParentBase.register({
  children: [policyChild],
})
const registeredPolicyFold = RegisteredPolicyParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel, message: Message) =>
    policyChild.fold(model, message),
  EffectsLayer: Layer.empty,
})
const omittedPolicyFold = OmittedPolicyParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel, message: Message) =>
    policyChild.fold(model, message),
  // @ts-expect-error An OutMessage policy retains nested child Step registration.
  EffectsLayer: Layer.empty,
})

const secondaryChildren = Child.keyedConnection({
  placement: 'secondary-children',
  readAll: (model: ParentModel) => model.children,
  key: childModel => childModel.count,
  read: childModel => childModel,
  writeAt: (model, key, nextChild) =>
    ParentModel.make({
      ...model,
      children: model.children.map(childModel =>
        childModel.count === key ? nextChild : childModel,
      ),
    }),
  toParentMessage: (_key, message: Message) => message,
})
const policyChildren = PolicyChild.keyedConnection({
  placement: 'policy-children',
  readAll: (model: ParentModel) => model.children,
  key: childModel => childModel.count,
  read: childModel => childModel,
  writeAt: (model, key, nextChild) =>
    ParentModel.make({
      ...model,
      children: model.children.map(childModel =>
        childModel.count === key ? nextChild : childModel,
      ),
    }),
  toParentMessage: (_key, message: Message) => message,
  outMessage: {
    fold: (_key: number, _outMessage: PolicyOutMessage) =>
      secondaryChildren.reset(0),
  },
})

const keyedPolicyParentBase = define('RegisteredKeyedPolicyParent').define({
  Model: ParentModel,
  Message,
})
const RegisteredKeyedPolicyParent = keyedPolicyParentBase.register({
  children: [policyChildren, secondaryChildren],
})
const omittedKeyedPolicyParentBase = define('OmittedKeyedPolicyParent').define({
  Model: ParentModel,
  Message,
})
const OmittedKeyedPolicyParent = omittedKeyedPolicyParentBase.register({
  children: [policyChildren],
})
const registeredKeyedPolicyFold = RegisteredKeyedPolicyParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel, message: Message) =>
    policyChildren.fold(model, 0, message),
  EffectsLayer: Layer.empty,
})
const omittedKeyedPolicyFold = OmittedKeyedPolicyParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel, message: Message) =>
    policyChildren.fold(model, 0, message),
  // @ts-expect-error A keyed OutMessage policy retains child Step registration.
  EffectsLayer: Layer.empty,
})

const foldedOutMessageInit = () =>
  Update.foldChildInit(
    Update.withOutMessage(
      child.init(),
      PolicyOutMessage.RequestedSecondaryReset(),
    ),
    {
      toParentModel: makeParentModel,
      toParentMessage: (message: Message) => message,
      foldOutMessage: (_outMessage: PolicyOutMessage) => secondaryChild.reset(),
    },
  )
const foldOutMessageParentBase = define(
  'RegisteredFoldOutMessageInitParent',
).define({
  Model: ParentModel,
  Message,
})
const RegisteredFoldOutMessageParent = foldOutMessageParentBase.register({
  children: [child, secondaryChild],
})
const omittedFoldOutMessageParentBase = define(
  'OmittedFoldOutMessageInitParent',
).define({
  Model: ParentModel,
  Message,
})
const OmittedFoldOutMessageParent = omittedFoldOutMessageParentBase.register({
  children: [child],
})
const registeredFoldOutMessageInit = RegisteredFoldOutMessageParent.toBlock({
  init: foldedOutMessageInit,
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedFoldOutMessageInit = OmittedFoldOutMessageParent.toBlock({
  init: foldedOutMessageInit,
  update: (model: ParentModel) => ({ model }),
  // @ts-expect-error foldChildInit retains registration from its OutMessage Step.
  EffectsLayer: Layer.empty,
})
const foldedOutMessageInitFolds = {
  child: {
    toParentMessage: (message: Message) => message,
    foldOutMessage: (_outMessage: PolicyOutMessage) => secondaryChild.reset(),
  },
}
const foldedOutMessageChildInits = {
  child: Update.withOutMessage(
    child.init(),
    PolicyOutMessage.RequestedSecondaryReset(),
  ),
}
const toFoldedOutMessageParentModel = ({
  child: childModel,
}: Readonly<{ child: ChildModel }>) => makeParentModel(childModel)
const foldedOutMessageInits = () =>
  Update.foldChildInits(foldedOutMessageChildInits, {
    toParentModel: toFoldedOutMessageParentModel,
    folds: foldedOutMessageInitFolds,
  })
const registeredFoldOutMessageInits = RegisteredFoldOutMessageParent.toBlock({
  init: foldedOutMessageInits,
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedFoldOutMessageInits = OmittedFoldOutMessageParent.toBlock({
  init: foldedOutMessageInits,
  update: (model: ParentModel) => ({ model }),
  // @ts-expect-error foldChildInits retains registration from each OutMessage Step.
  EffectsLayer: Layer.empty,
})

const LifecycleOwner = define('RegistrationLifecycleChild')
const lifecycleDefinition = LifecycleOwner.define({
  Model: ChildModel,
  Message,
})
const lifecycleSubscriptions = lifecycleDefinition.subscriptions(entry => ({
  idle: entry('Idle', {
    messages: [],
    handler: function* () {
      return () => Stream.never
    },
  }),
}))
const LifecycleChild = lifecycleDefinition.toBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: (model: ChildModel) => ({ model }),
  subscriptions: lifecycleSubscriptions,
  EffectsLayer: lifecycleSubscriptions.idle.layer,
})
const lifecycleChild = LifecycleChild.connection({
  placement: 'lifecycle-child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
})

const lifecycleOnlyParentBase = define('LifecycleOnlyChildParent').define({
  Model: ParentModel,
  Message,
})
const LifecycleOnlyParent = lifecycleOnlyParentBase.register({
  children: [lifecycleChild],
})
const RemovedLifecycleParent = define('RemovedLifecycleChildParent').define({
  Model: ParentModel,
  Message,
})
const lifecycleOnlyChild = LifecycleOnlyParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})
const removedLifecycleChild = RemovedLifecycleParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})

const childResultWithOutMessage = Update.withOutMessage(
  child.reset()(makeParentModel(ChildModel.make({ count: 1 }))),
  Message.Advanced(),
)

void registeredFold
void omittedFold
void registeredStep
void omittedStep
void registeredCombinedStep
void omittedCombinedStep
void registeredDynamicCombinedStep
void omittedDynamicCombinedStep
void registeredInit
void omittedInit
void registeredDefinitionUpdate
void omittedDefinitionUpdate
void registeredGenericUpdate
void omittedGenericUpdate
void registeredBranchUpdate
void omittedBranchUpdate
void explicitlyAnnotatedUpdate
void explicitlyAnnotatedCallback
void registeredMappedInit
void omittedMappedInit
void registeredFoldedChildInit
void omittedFoldedChildInit
void registeredFoldedChildInits
void omittedFoldedChildInits
void modelOnlyChildInit
void unusedChild
void removedUnusedChild
void registeredKeyedFold
void omittedKeyedFold
void registeredKeyedStep
void omittedKeyedStep
void registeredKeyedCombinedStep
void omittedKeyedCombinedStep
void registeredKeyedInit
void omittedKeyedInit
void unsupportedNestedRawChildStep
void registeredPolicyFold
void omittedPolicyFold
void registeredKeyedPolicyFold
void omittedKeyedPolicyFold
void registeredFoldOutMessageInit
void omittedFoldOutMessageInit
void registeredFoldOutMessageInits
void omittedFoldOutMessageInits
void lifecycleOnlyChild
void removedLifecycleChild

it('keeps the declared child graph independent from operation use', () => {
  expect(registeredFold.children).toEqual([child])
  expect(removedUnusedChild.children).toEqual([])
  expect(lifecycleOnlyChild.children).toEqual([lifecycleChild])
  expect(removedLifecycleChild.children).toEqual([])
  expectTypeOf<
    Update.RegistrationEvidenceOf<typeof childResultWithOutMessage>
  >().toEqualTypeOf<BindingRequirement<'child', typeof Child>>()
  expectTypeOf<
    Update.RequirementsOf<() => typeof childResultWithOutMessage>
  >().toEqualTypeOf<never>()
})
