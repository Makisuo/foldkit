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
const Child = ChildOwner.define({ Model: ChildModel, Message })
const reset = Child.step(_model => ({
  model: ChildModel.make({ count: 0 }),
}))
const ChildComposition = Child.toComposition()
const ChildBlock = ChildComposition.toBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: ChildComposition.update(model => ({
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

const makeParentModelWithChildOccurrence = (child: ChildModel): ParentModel =>
  ParentModel.make({ child, children: [child] })

const registeredParentBase = define('RegisteredPureChildParent').define({
  Model: ParentModel,
  Message,
})
const ChildBinding = registeredParentBase.bindChild(ChildBlock, {
  fromParentMessage: false,
  placement: 'child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
})

const RegisteredParent = registeredParentBase.toComposition({
  childBindings: [ChildBinding],
})
const OmittedParent = define('OmittedPureChildParent')
  .define({
    Model: ParentModel,
    Message,
  })
  .toComposition()

const registeredFold = RegisteredParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model, message) => ChildBinding.fold(model, message),
  EffectsLayer: Layer.empty,
})
const omittedFold = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model, message) => ChildBinding.fold(model, message),
  // @ts-expect-error A pure fold may use only a registered child binding.
  EffectsLayer: Layer.empty,
})

const registeredStep = RegisteredParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => ChildBinding.reset()(model),
  EffectsLayer: Layer.empty,
})
const omittedStep = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => ChildBinding.reset()(model),
  // @ts-expect-error A pure Step may use only a registered child binding.
  EffectsLayer: Layer.empty,
})

const registeredCombinedStep = RegisteredParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => Update.combine(model, [ChildBinding.reset()]),
  EffectsLayer: Layer.empty,
})
const omittedCombinedStep = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => Update.combine(model, [ChildBinding.reset()]),
  // @ts-expect-error combine preserves the registration of every child Step.
  EffectsLayer: Layer.empty,
})

const dynamicChildSteps = Array.map([ChildBinding.reset()], step => step)
const registeredDynamicCombinedStep = RegisteredParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => Update.combine(model, dynamicChildSteps),
  EffectsLayer: Layer.empty,
})
const omittedDynamicCombinedStep = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => Update.combine(model, dynamicChildSteps),
  // @ts-expect-error A computed Step list retains its child registration.
  EffectsLayer: Layer.empty,
})

const registeredInit = RegisteredParent.toBlock({
  init: () => ChildBinding.init({ args: [], toParentModel: makeParentModel }),
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedInit = OmittedParent.toBlock({
  init: () => ChildBinding.init({ args: [], toParentModel: makeParentModel }),
  update: model => ({ model }),
  // @ts-expect-error Forwarded init Commands retain their child registration.
  EffectsLayer: Layer.empty,
})

const registeredDefinedUpdate = RegisteredParent.update((model, message) =>
  ChildBinding.fold(model, message),
)
const registeredDefinitionUpdate = RegisteredParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: registeredDefinedUpdate,
  EffectsLayer: Layer.empty,
})
const omittedDefinedUpdate = OmittedParent.update((model, message) =>
  ChildBinding.fold(model, message),
)
const omittedDefinitionUpdate = OmittedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: omittedDefinedUpdate,
  // @ts-expect-error A defined update preserves the binding used by its result.
  EffectsLayer: Layer.empty,
})

const genericUpdate = Update.define((model: ParentModel, message: Message) =>
  ChildBinding.fold(model, message),
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
  message._tag === 'Advanced' ? ChildBinding.reset()(model) : { model },
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
      return ChildBinding.reset()(model)
    },
    Ignored: () => ({ model }),
  })

const explicitlyAnnotatedCallback = (
  model: ParentModel,
): Update.Return<ParentModel, Message> => {
  // @ts-expect-error An explicit callback return cannot erase child registration evidence.
  return ChildBinding.reset()(model)
}

const mappedChildInit = () => {
  const childInit = ChildBinding.init({
    args: [],
    toParentModel: makeParentModel,
  })
  return {
    model: childInit.model,
    commands: Command.mapMessages(childInit.commands, message => message),
  }
}
const registeredMappedInit = RegisteredParent.toBlock({
  init: mappedChildInit,
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedMappedInit = OmittedParent.toBlock({
  init: mappedChildInit,
  update: model => ({ model }),
  // @ts-expect-error mapMessages preserves child registration on the collection.
  EffectsLayer: Layer.empty,
})

const foldedChildInit = () =>
  Update.foldChildInit(
    ChildBinding.init({ args: [], toParentModel: makeParentModel }),
    {
      toParentModel: model => model,
      toParentMessage: (message: Message) => message,
    },
  )
const registeredFoldedChildInit = RegisteredParent.toBlock({
  init: foldedChildInit,
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedFoldedChildInit = OmittedParent.toBlock({
  init: foldedChildInit,
  update: model => ({ model }),
  // @ts-expect-error foldChildInit preserves its child's registration.
  EffectsLayer: Layer.empty,
})

const foldedChildInits = () =>
  Update.foldChildInits(
    {
      child: ChildBinding.init({
        args: [],
        toParentModel: makeParentModel,
      }),
    },
    {
      toParentModel: ({ child: model }) => model,
      folds: {
        child: { toParentMessage: (message: Message) => message },
      },
    },
  )
const registeredFoldedChildInits = RegisteredParent.toBlock({
  init: foldedChildInits,
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedFoldedChildInits = OmittedParent.toBlock({
  init: foldedChildInits,
  update: model => ({ model }),
  // @ts-expect-error foldChildInits preserves every child's registration.
  EffectsLayer: Layer.empty,
})

const modelOnlyChildInit = OmittedParent.toBlock({
  init: () => ({
    model: ChildBinding.init({
      args: [],
      toParentModel: makeParentModel,
    }).model,
  }),
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})

const unusedChildParentBase = define('UnusedRegisteredChildParent').define({
  Model: ParentModel,
  Message,
})
const UnusedRegisteredChildBinding = unusedChildParentBase.bindChild(
  ChildBlock,
  {
    fromParentMessage: false,
    placement: 'child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    toParentMessage: (message: Message) => message,
  },
)
const UnusedChildParent = unusedChildParentBase.toComposition({
  childBindings: [UnusedRegisteredChildBinding],
})
const RemovedUnusedChildParent = define('RemovedUnusedChildParent')
  .define({
    Model: ParentModel,
    Message,
  })
  .toComposition()
const unusedChild = UnusedChildParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})
const removedUnusedChild = RemovedUnusedChildParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})

const registeredKeyedParentBase = define(
  'RegisteredPureKeyedChildParent',
).define({
  Model: ParentModel,
  Message,
})
const ChildrenBinding = registeredKeyedParentBase.bindChild(ChildBlock, {
  fromParentMessage: false,
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
  childBindings: [ChildrenBinding],
})
const OmittedKeyedParent = define('OmittedPureKeyedChildParent')
  .define({
    Model: ParentModel,
    Message,
  })
  .toComposition()

const registeredKeyedFold = RegisteredKeyedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model, message) => ChildrenBinding.fold(model, 0, message),
  EffectsLayer: Layer.empty,
})
const omittedKeyedFold = OmittedKeyedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model, message) => ChildrenBinding.fold(model, 0, message),
  // @ts-expect-error A keyed pure fold requires its registered collection.
  EffectsLayer: Layer.empty,
})

const registeredKeyedStep = RegisteredKeyedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => ChildrenBinding.reset(0)(model),
  EffectsLayer: Layer.empty,
})
const omittedKeyedStep = OmittedKeyedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => ChildrenBinding.reset(0)(model),
  // @ts-expect-error A keyed pure Step requires its registered collection.
  EffectsLayer: Layer.empty,
})

const registeredKeyedCombinedStep = RegisteredKeyedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => Update.combine(model, [ChildrenBinding.reset(0)]),
  EffectsLayer: Layer.empty,
})
const omittedKeyedCombinedStep = OmittedKeyedParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => Update.combine(model, [ChildrenBinding.reset(0)]),
  // @ts-expect-error combine preserves a keyed child Step's registration.
  EffectsLayer: Layer.empty,
})

const registeredKeyedInit = RegisteredKeyedParent.toBlock({
  init: () =>
    ChildrenBinding.init({
      key: 0,
      args: [],
      toParentModel: makeParentModelWithChildOccurrence,
    }),
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedKeyedInit = OmittedKeyedParent.toBlock({
  init: () =>
    ChildrenBinding.init({
      key: 0,
      args: [],
      toParentModel: makeParentModelWithChildOccurrence,
    }),
  update: model => ({ model }),
  // @ts-expect-error Keyed init Commands retain their collection registration.
  EffectsLayer: Layer.empty,
})

const PolicyOutMessage = defineMessageUnion({ RequestedSecondaryReset: {} })
type PolicyOutMessage = typeof PolicyOutMessage.Type

const PolicyChild = define('RegistrationPolicyChild').define({
  Model: ChildModel,
  Message,
  OutMessage: PolicyOutMessage,
})
const PolicyChildBlock = PolicyChild.toComposition().toBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: model => ({
    model,
    outMessage: PolicyOutMessage.RequestedSecondaryReset(),
  }),
  EffectsLayer: Layer.empty,
})

const policyParentBase = define('RegisteredPolicyParent').define({
  Model: ParentModel,
  Message,
})
const SecondaryChildBinding = policyParentBase.bindChild(ChildBlock, {
  fromParentMessage: false,
  placement: 'secondary-child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
})
const unsupportedNestedRawChildStep = Update.foldChildStep({
  // @ts-expect-error A raw child fold cannot erase a binding operation's registration.
  update: (model: ParentModel) => SecondaryChildBinding.reset()(model),
  read: (model: ParentModel) => Option.some(model),
  write: (_model, nextModel) => nextModel,
  toParentMessage: (message: Message) => message,
})
const PolicyChildBinding = policyParentBase.bindChild(PolicyChildBlock, {
  fromParentMessage: false,
  placement: 'policy-child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  toParentMessage: (message: Message) => message,
  outMessage: {
    fold: (_outMessage: PolicyOutMessage) => (model: ParentModel) =>
      Update.combine(model, [SecondaryChildBinding.reset()]),
  },
})

const RegisteredPolicyParent = policyParentBase.toComposition({
  childBindings: [PolicyChildBinding, SecondaryChildBinding],
})
const omittedPolicyParentBase = define('OmittedPolicyParent').define({
  Model: ParentModel,
  Message,
})
const OmittedSecondaryChildBinding = omittedPolicyParentBase.bindChild(
  ChildBlock,
  {
    fromParentMessage: false,
    placement: 'secondary-child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    toParentMessage: (message: Message) => message,
  },
)
const OmittedPolicyChildBinding = omittedPolicyParentBase.bindChild(
  PolicyChildBlock,
  {
    fromParentMessage: false,
    placement: 'policy-child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    toParentMessage: (message: Message) => message,
    outMessage: {
      fold: (_outMessage: PolicyOutMessage) => (model: ParentModel) =>
        Update.combine(model, [OmittedSecondaryChildBinding.reset()]),
    },
  },
)
// @ts-expect-error An OutMessage policy retains nested child Step registration.
const OmittedPolicyParent = omittedPolicyParentBase.toComposition({
  childBindings: [OmittedPolicyChildBinding],
})
const registeredPolicyFold = RegisteredPolicyParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model, message) => PolicyChildBinding.fold(model, message),
  EffectsLayer: Layer.empty,
})
const omittedPolicyFold = OmittedPolicyParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model, message) => OmittedPolicyChildBinding.fold(model, message),
  // @ts-expect-error An OutMessage policy retains nested child Step registration.
  EffectsLayer: Layer.empty,
})

const keyedPolicyParentBase = define('RegisteredKeyedPolicyParent').define({
  Model: ParentModel,
  Message,
})
const childModelKey = (childModel: ChildModel) => childModel.count
const SecondaryChildrenBinding = keyedPolicyParentBase.bindChild(ChildBlock, {
  fromParentMessage: false,
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
const PolicyChildrenBinding = keyedPolicyParentBase.bindChild(
  PolicyChildBlock,
  {
    fromParentMessage: false,
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
        SecondaryChildrenBinding.reset(0),
    },
  },
)

const RegisteredKeyedPolicyParent = keyedPolicyParentBase.toComposition({
  childBindings: [PolicyChildrenBinding, SecondaryChildrenBinding],
})
const omittedKeyedPolicyParentBase = define('OmittedKeyedPolicyParent').define({
  Model: ParentModel,
  Message,
})
const OmittedSecondaryChildrenBinding = omittedKeyedPolicyParentBase.bindChild(
  ChildBlock,
  {
    fromParentMessage: false,
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
  },
)
const OmittedPolicyChildrenBinding = omittedKeyedPolicyParentBase.bindChild(
  PolicyChildBlock,
  {
    fromParentMessage: false,
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
        OmittedSecondaryChildrenBinding.reset(0),
    },
  },
)
// @ts-expect-error A keyed OutMessage policy retains child Step registration.
const OmittedKeyedPolicyParent = omittedKeyedPolicyParentBase.toComposition({
  childBindings: [OmittedPolicyChildrenBinding],
})
const registeredKeyedPolicyFold = RegisteredKeyedPolicyParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model, message) => PolicyChildrenBinding.fold(model, 0, message),
  EffectsLayer: Layer.empty,
})
const omittedKeyedPolicyFold = OmittedKeyedPolicyParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: (model, message) =>
    OmittedPolicyChildrenBinding.fold(model, 0, message),
  // @ts-expect-error A keyed OutMessage policy retains child Step registration.
  EffectsLayer: Layer.empty,
})

const foldOutMessageParentBase = define(
  'RegisteredFoldOutMessageInitParent',
).define({
  Model: ParentModel,
  Message,
})
const FoldOutMessageChildBinding = foldOutMessageParentBase.bindChild(
  ChildBlock,
  {
    fromParentMessage: false,
    placement: 'child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    toParentMessage: (message: Message) => message,
  },
)
const FoldOutMessageSecondaryChildBinding = foldOutMessageParentBase.bindChild(
  ChildBlock,
  {
    fromParentMessage: false,
    placement: 'secondary-child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    toParentMessage: (message: Message) => message,
  },
)
const RegisteredFoldOutMessageParent = foldOutMessageParentBase.toComposition({
  childBindings: [
    FoldOutMessageChildBinding,
    FoldOutMessageSecondaryChildBinding,
  ],
})
const omittedFoldOutMessageParentBase = define(
  'OmittedFoldOutMessageInitParent',
).define({
  Model: ParentModel,
  Message,
})
const OmittedFoldOutMessageChildBinding =
  omittedFoldOutMessageParentBase.bindChild(ChildBlock, {
    fromParentMessage: false,
    placement: 'child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    toParentMessage: (message: Message) => message,
  })
const OmittedFoldOutMessageSecondaryChildBinding =
  omittedFoldOutMessageParentBase.bindChild(ChildBlock, {
    fromParentMessage: false,
    placement: 'secondary-child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    toParentMessage: (message: Message) => message,
  })
const OmittedFoldOutMessageParent =
  omittedFoldOutMessageParentBase.toComposition({
    childBindings: [OmittedFoldOutMessageChildBinding],
  })
const registeredFoldedOutMessageInit = () =>
  Update.foldChildInit(
    Update.withOutMessage(
      FoldOutMessageChildBinding.init({
        args: [],
        toParentModel: makeParentModel,
      }),
      PolicyOutMessage.RequestedSecondaryReset(),
    ),
    {
      toParentModel: model => model,
      toParentMessage: (message: Message) => message,
      foldOutMessage: (_outMessage: PolicyOutMessage) =>
        FoldOutMessageSecondaryChildBinding.reset(),
    },
  )
const omittedFoldedOutMessageInit = () =>
  Update.foldChildInit(
    Update.withOutMessage(
      OmittedFoldOutMessageChildBinding.init({
        args: [],
        toParentModel: makeParentModel,
      }),
      PolicyOutMessage.RequestedSecondaryReset(),
    ),
    {
      toParentModel: model => model,
      toParentMessage: (message: Message) => message,
      foldOutMessage: (_outMessage: PolicyOutMessage) =>
        OmittedFoldOutMessageSecondaryChildBinding.reset(),
    },
  )
const registeredFoldOutMessageInit = RegisteredFoldOutMessageParent.toBlock({
  init: registeredFoldedOutMessageInit,
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedFoldOutMessageInit = OmittedFoldOutMessageParent.toBlock({
  init: omittedFoldedOutMessageInit,
  update: model => ({ model }),
  // @ts-expect-error foldChildInit retains registration from its OutMessage Step.
  EffectsLayer: Layer.empty,
})
const toFoldedOutMessageParentModel = ({
  child: model,
}: Readonly<{
  child: ParentModel
}>) => model
const registeredFoldedOutMessageInitFolds = {
  child: {
    toParentMessage: (message: Message) => message,
    foldOutMessage: (_outMessage: PolicyOutMessage) =>
      FoldOutMessageSecondaryChildBinding.reset(),
  },
}
const registeredFoldedOutMessageChildInits = () => ({
  child: Update.withOutMessage(
    FoldOutMessageChildBinding.init({
      args: [],
      toParentModel: makeParentModel,
    }),
    PolicyOutMessage.RequestedSecondaryReset(),
  ),
})
const registeredFoldedOutMessageInits = () =>
  Update.foldChildInits(registeredFoldedOutMessageChildInits(), {
    toParentModel: toFoldedOutMessageParentModel,
    folds: registeredFoldedOutMessageInitFolds,
  })
const omittedFoldedOutMessageInitFolds = {
  child: {
    toParentMessage: (message: Message) => message,
    foldOutMessage: (_outMessage: PolicyOutMessage) =>
      OmittedFoldOutMessageSecondaryChildBinding.reset(),
  },
}
const omittedFoldedOutMessageChildInits = () => ({
  child: Update.withOutMessage(
    OmittedFoldOutMessageChildBinding.init({
      args: [],
      toParentModel: makeParentModel,
    }),
    PolicyOutMessage.RequestedSecondaryReset(),
  ),
})
const omittedFoldedOutMessageInits = () =>
  Update.foldChildInits(omittedFoldedOutMessageChildInits(), {
    toParentModel: toFoldedOutMessageParentModel,
    folds: omittedFoldedOutMessageInitFolds,
  })
const registeredFoldOutMessageInits = RegisteredFoldOutMessageParent.toBlock({
  init: registeredFoldedOutMessageInits,
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})
const omittedFoldOutMessageInits = OmittedFoldOutMessageParent.toBlock({
  init: omittedFoldedOutMessageInits,
  update: model => ({ model }),
  // @ts-expect-error foldChildInits retains registration from each OutMessage Step.
  EffectsLayer: Layer.empty,
})

const LifecycleOwner = define('RegistrationLifecycleChild')
const Lifecycle = LifecycleOwner.define({
  Model: ChildModel,
  Message,
})
const lifecycleSubscriptions = Lifecycle.subscriptions(entry => ({
  idle: entry('Idle', {
    messages: [],
    handler: function* () {
      return () => Stream.never
    },
  }),
}))
const LifecycleChild = Lifecycle.toComposition().toBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: model => ({ model }),
  subscriptions: lifecycleSubscriptions,
  EffectsLayer: lifecycleSubscriptions.idle.layer,
})
const lifecycleOnlyParentBase = define('LifecycleOnlyChildParent').define({
  Model: ParentModel,
  Message,
})
const LifecycleChildBinding = lifecycleOnlyParentBase.bindChild(
  LifecycleChild,
  {
    fromParentMessage: false,
    placement: 'lifecycle-child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    toParentMessage: (message: Message) => message,
  },
)

const LifecycleOnlyParent = lifecycleOnlyParentBase.toComposition({
  childBindings: [LifecycleChildBinding],
})
const RemovedLifecycleParent = define('RemovedLifecycleChildParent')
  .define({
    Model: ParentModel,
    Message,
  })
  .toComposition()
const lifecycleOnlyChild = LifecycleOnlyParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})
const removedLifecycleChild = RemovedLifecycleParent.toBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})

const childResultWithOutMessage = Update.withOutMessage(
  ChildBinding.reset()(makeParentModel(ChildModel.make({ count: 1 }))),
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
  expect(registeredFold.childBindings).toEqual([ChildBinding])
  expect(removedUnusedChild.childBindings).toEqual([])
  expect(lifecycleOnlyChild.childBindings).toEqual([LifecycleChildBinding])
  expect(removedLifecycleChild.childBindings).toEqual([])
  expectTypeOf<
    Update.RegistrationEvidenceOf<typeof childResultWithOutMessage>
  >().toEqualTypeOf<BindingRequirement<'child', typeof ChildBlock>>()
  expectTypeOf<
    Update.RequirementsOf<() => typeof childResultWithOutMessage>
  >().toEqualTypeOf<never>()
})
