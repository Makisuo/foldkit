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
const Child = childDefinition.toComposition().toBlock({
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

const registeredParentBase = define('RegisteredPureChildParent').define({
  Model: ParentModel,
  Message,
})
const child = registeredParentBase.bindChild(Child, {
  placement: 'child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
})

const RegisteredParent = registeredParentBase.toComposition({
  children: [child],
})
const OmittedParent = define('OmittedPureChildParent')
  .define({
    Model: ParentModel,
    Message,
  })
  .toComposition()

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
const unusedRegisteredChild = unusedChildParentBase.bindChild(Child, {
  placement: 'child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
})
const UnusedChildParent = unusedChildParentBase.toComposition({
  children: [unusedRegisteredChild],
})
const RemovedUnusedChildParent = define('RemovedUnusedChildParent')
  .define({
    Model: ParentModel,
    Message,
  })
  .toComposition()
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

const registeredKeyedParentBase = define(
  'RegisteredPureKeyedChildParent',
).define({
  Model: ParentModel,
  Message,
})
const children = registeredKeyedParentBase.bindChild(Child, {
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

const RegisteredKeyedParent = registeredKeyedParentBase.toComposition({
  children: [children],
})
const OmittedKeyedParent = define('OmittedPureKeyedChildParent')
  .define({
    Model: ParentModel,
    Message,
  })
  .toComposition()

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
const PolicyChild = policyChildDefinition.toComposition().toBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: (model: ChildModel) => ({
    model,
    outMessage: PolicyOutMessage.RequestedSecondaryReset(),
  }),
  EffectsLayer: Layer.empty,
})

const policyParentBase = define('RegisteredPolicyParent').define({
  Model: ParentModel,
  Message,
})
const secondaryChild = policyParentBase.bindChild(Child, {
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
const policyChild = policyParentBase.bindChild(PolicyChild, {
  placement: 'policy-child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
  outMessage: {
    fold: (_outMessage: PolicyOutMessage) => (model: ParentModel) =>
      Update.combine(model, [secondaryChild.reset()]),
  },
})

const RegisteredPolicyParent = policyParentBase.toComposition({
  children: [policyChild, secondaryChild],
})
const omittedPolicyParentBase = define('OmittedPolicyParent').define({
  Model: ParentModel,
  Message,
})
const omittedSecondaryChild = omittedPolicyParentBase.bindChild(Child, {
  placement: 'secondary-child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
})
const omittedPolicyChild = omittedPolicyParentBase.bindChild(PolicyChild, {
  placement: 'policy-child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
  outMessage: {
    fold: (_outMessage: PolicyOutMessage) => (model: ParentModel) =>
      Update.combine(model, [omittedSecondaryChild.reset()]),
  },
})
const OmittedPolicyParent = omittedPolicyParentBase.toComposition({
  children: [omittedPolicyChild],
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
    omittedPolicyChild.fold(model, message),
  // @ts-expect-error An OutMessage policy retains nested child Step registration.
  EffectsLayer: Layer.empty,
})

const keyedPolicyParentBase = define('RegisteredKeyedPolicyParent').define({
  Model: ParentModel,
  Message,
})
const childModelKey = (childModel: ChildModel) => childModel.count
const secondaryChildren = keyedPolicyParentBase.bindChild(Child, {
  placement: 'secondary-children',
  readAll: (model: ParentModel) => model.children,
  key: childModelKey,
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
const policyChildren = keyedPolicyParentBase.bindChild(PolicyChild, {
  placement: 'policy-children',
  readAll: (model: ParentModel) => model.children,
  key: childModelKey,
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

const RegisteredKeyedPolicyParent = keyedPolicyParentBase.toComposition({
  children: [policyChildren, secondaryChildren],
})
const omittedKeyedPolicyParentBase = define('OmittedKeyedPolicyParent').define({
  Model: ParentModel,
  Message,
})
const omittedSecondaryChildren = omittedKeyedPolicyParentBase.bindChild(Child, {
  placement: 'secondary-children',
  readAll: (model: ParentModel) => model.children,
  key: childModelKey,
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
const omittedPolicyChildren = omittedKeyedPolicyParentBase.bindChild(
  PolicyChild,
  {
    placement: 'policy-children',
    readAll: (model: ParentModel) => model.children,
    key: childModelKey,
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
        omittedSecondaryChildren.reset(0),
    },
  },
)
const OmittedKeyedPolicyParent = omittedKeyedPolicyParentBase.toComposition({
  children: [omittedPolicyChildren],
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
    omittedPolicyChildren.fold(model, 0, message),
  // @ts-expect-error A keyed OutMessage policy retains child Step registration.
  EffectsLayer: Layer.empty,
})

const foldOutMessageParentBase = define(
  'RegisteredFoldOutMessageInitParent',
).define({
  Model: ParentModel,
  Message,
})
const foldOutMessageChild = foldOutMessageParentBase.bindChild(Child, {
  placement: 'child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
})
const foldOutMessageSecondaryChild = foldOutMessageParentBase.bindChild(Child, {
  placement: 'secondary-child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
})
const RegisteredFoldOutMessageParent = foldOutMessageParentBase.toComposition({
  children: [foldOutMessageChild, foldOutMessageSecondaryChild],
})
const omittedFoldOutMessageParentBase = define(
  'OmittedFoldOutMessageInitParent',
).define({
  Model: ParentModel,
  Message,
})
const omittedFoldOutMessageChild = omittedFoldOutMessageParentBase.bindChild(
  Child,
  {
    placement: 'child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    toParentMessage: (message: Message) => message,
  },
)
const omittedFoldOutMessageSecondaryChild =
  omittedFoldOutMessageParentBase.bindChild(Child, {
    placement: 'secondary-child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    toParentMessage: (message: Message) => message,
  })
const OmittedFoldOutMessageParent =
  omittedFoldOutMessageParentBase.toComposition({
    children: [omittedFoldOutMessageChild],
  })
const registeredFoldedOutMessageInit = () =>
  Update.foldChildInit(
    Update.withOutMessage(
      foldOutMessageChild.init(),
      PolicyOutMessage.RequestedSecondaryReset(),
    ),
    {
      toParentModel: makeParentModel,
      toParentMessage: (message: Message) => message,
      foldOutMessage: (_outMessage: PolicyOutMessage) =>
        foldOutMessageSecondaryChild.reset(),
    },
  )
const omittedFoldedOutMessageInit = () =>
  Update.foldChildInit(
    Update.withOutMessage(
      omittedFoldOutMessageChild.init(),
      PolicyOutMessage.RequestedSecondaryReset(),
    ),
    {
      toParentModel: makeParentModel,
      toParentMessage: (message: Message) => message,
      foldOutMessage: (_outMessage: PolicyOutMessage) =>
        omittedFoldOutMessageSecondaryChild.reset(),
    },
  )
const registeredFoldOutMessageInit = RegisteredFoldOutMessageParent.toBlock({
  init: registeredFoldedOutMessageInit,
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedFoldOutMessageInit = OmittedFoldOutMessageParent.toBlock({
  init: omittedFoldedOutMessageInit,
  update: (model: ParentModel) => ({ model }),
  // @ts-expect-error foldChildInit retains registration from its OutMessage Step.
  EffectsLayer: Layer.empty,
})
const toFoldedOutMessageParentModel = ({
  child: childModel,
}: Readonly<{ child: ChildModel }>) => makeParentModel(childModel)
const registeredFoldedOutMessageInitFolds = {
  child: {
    toParentMessage: (message: Message) => message,
    foldOutMessage: (_outMessage: PolicyOutMessage) =>
      foldOutMessageSecondaryChild.reset(),
  },
}
const registeredFoldedOutMessageChildInits = {
  child: Update.withOutMessage(
    foldOutMessageChild.init(),
    PolicyOutMessage.RequestedSecondaryReset(),
  ),
}
const registeredFoldedOutMessageInits = () =>
  Update.foldChildInits(registeredFoldedOutMessageChildInits, {
    toParentModel: toFoldedOutMessageParentModel,
    folds: registeredFoldedOutMessageInitFolds,
  })
const omittedFoldedOutMessageInitFolds = {
  child: {
    toParentMessage: (message: Message) => message,
    foldOutMessage: (_outMessage: PolicyOutMessage) =>
      omittedFoldOutMessageSecondaryChild.reset(),
  },
}
const omittedFoldedOutMessageChildInits = {
  child: Update.withOutMessage(
    omittedFoldOutMessageChild.init(),
    PolicyOutMessage.RequestedSecondaryReset(),
  ),
}
const omittedFoldedOutMessageInits = () =>
  Update.foldChildInits(omittedFoldedOutMessageChildInits, {
    toParentModel: toFoldedOutMessageParentModel,
    folds: omittedFoldedOutMessageInitFolds,
  })
const registeredFoldOutMessageInits = RegisteredFoldOutMessageParent.toBlock({
  init: registeredFoldedOutMessageInits,
  update: (model: ParentModel) => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedFoldOutMessageInits = OmittedFoldOutMessageParent.toBlock({
  init: omittedFoldedOutMessageInits,
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
const LifecycleChild = lifecycleDefinition.toComposition().toBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: (model: ChildModel) => ({ model }),
  subscriptions: lifecycleSubscriptions,
  EffectsLayer: lifecycleSubscriptions.idle.layer,
})
const lifecycleOnlyParentBase = define('LifecycleOnlyChildParent').define({
  Model: ParentModel,
  Message,
})
const lifecycleChild = lifecycleOnlyParentBase.bindChild(LifecycleChild, {
  placement: 'lifecycle-child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
})

const LifecycleOnlyParent = lifecycleOnlyParentBase.toComposition({
  children: [lifecycleChild],
})
const RemovedLifecycleParent = define('RemovedLifecycleChildParent')
  .define({
    Model: ParentModel,
    Message,
  })
  .toComposition()
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
