import { Array, Layer, Option, Schema, Stream, Tuple } from 'effect'
import { expect, expectTypeOf, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import * as Update from '../update/index.js'
import type { BindingRequirement } from './binding.js'
import { define } from './define.js'

const ChildModel = Schema.Struct({ count: Schema.Number })
type ChildModel = typeof ChildModel.Type

const Message = defineMessageUnion({
  RequestedReset: {},
  Advanced: {},
  Ignored: {},
})
type Message = typeof Message.Type
const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: Message },
  Advanced: {},
  Ignored: {},
})

const ChildOwner = define('RegistrationChild')
const ChildDefinition = ChildOwner.define({ Model: ChildModel, Message })
const reset = ChildDefinition.step(_model => ({
  model: ChildModel.make({ count: 0 }),
}))
const ChildComposition = ChildDefinition.makeComposition()
const ChildBlock = ChildComposition.makeBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: ChildComposition.makeUpdate((model, message) =>
    Message.match(message, {
      RequestedReset: () => reset(model),
      Advanced: () => ({
        model: ChildModel.make({ count: model.count + 1 }),
      }),
      Ignored: () => ({
        model: ChildModel.make({ count: model.count + 1 }),
      }),
    }),
  ),
  operations: { reset: () => Tuple.make(Message.RequestedReset()) },
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

const RegisteredParentBaseDefinition = define(
  'RegisteredPureChildParent',
).define({
  Model: ParentModel,
  Message: ParentMessage,
})
const ChildBinding = RegisteredParentBaseDefinition.bindChild(ChildBlock, {
  placement: 'child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  parentMessage: ParentMessage.GotChildMessage,
})

const RegisteredParent = RegisteredParentBaseDefinition.makeComposition({
  childBindings: [ChildBinding],
})
const OmittedParentBaseDefinition = define('OmittedPureChildParent').define({
  Model: ParentModel,
  Message: ParentMessage,
})
const AlternateChildBinding = OmittedParentBaseDefinition.bindChild(
  ChildBlock,
  {
    field: 'child',
    placement: 'alternate',
    parentMessage: ParentMessage.GotChildMessage,
    init: false,
  },
)
const OmittedParent = OmittedParentBaseDefinition.makeComposition({
  childBindings: [AlternateChildBinding],
})

const registeredFold = RegisteredParent.makeBlock({
  init: RegisteredParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: RegisteredParent.makeUpdate((model, message) =>
    ChildBinding.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})
// @ts-expect-error A pure fold may use only a registered child binding.
const omittedFold = OmittedParent.makeBlock({
  init: OmittedParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: OmittedParent.makeUpdate((model, message) =>
    // @ts-expect-error A pure fold cannot execute without its registered child Binding.
    ChildBinding.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const registeredStep = RegisteredParent.makeBlock({
  init: RegisteredParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: RegisteredParent.makeUpdate(model => ChildBinding.reset()(model)),
  EffectsLayer: Layer.empty,
})
// @ts-expect-error A pure Step may use only a registered child binding.
const omittedStep = OmittedParent.makeBlock({
  init: OmittedParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: OmittedParent.makeUpdate(model =>
    // @ts-expect-error A pure Step cannot execute without its registered child Binding.
    ChildBinding.reset()(model),
  ),
  EffectsLayer: Layer.empty,
})

const registeredCombinedStep = RegisteredParent.makeBlock({
  init: RegisteredParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: RegisteredParent.makeUpdate(model =>
    Update.combine(model, [ChildBinding.reset()]),
  ),
  EffectsLayer: Layer.empty,
})
// @ts-expect-error combine preserves the registration of every child Step.
const omittedCombinedStep = OmittedParent.makeBlock({
  init: OmittedParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: OmittedParent.makeUpdate(model =>
    // @ts-expect-error combine cannot execute a child Step without its registered Binding.
    Update.combine(model, [ChildBinding.reset()]),
  ),
  EffectsLayer: Layer.empty,
})

const dynamicChildSteps = Array.map([ChildBinding.reset()], step => step)
const registeredDynamicCombinedStep = RegisteredParent.makeBlock({
  init: RegisteredParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: RegisteredParent.makeUpdate(model =>
    Update.combine(model, dynamicChildSteps),
  ),
  EffectsLayer: Layer.empty,
})
// @ts-expect-error A computed Step list retains its child registration.
const omittedDynamicCombinedStep = OmittedParent.makeBlock({
  init: OmittedParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: OmittedParent.makeUpdate(model =>
    // @ts-expect-error A computed Step list cannot execute without its registered Binding.
    Update.combine(model, dynamicChildSteps),
  ),
  EffectsLayer: Layer.empty,
})

const registeredInit = RegisteredParent.makeBlock({
  init: RegisteredParent.makeInit(() =>
    ChildBinding.init({ args: [], toParentModel: makeParentModel }),
  ),
  update: RegisteredParent.makeUpdate(model => ({ model })),
  EffectsLayer: Layer.empty,
})
// @ts-expect-error Forwarded init Commands retain their child registration.
const omittedInit = OmittedParent.makeBlock({
  init: OmittedParent.makeInit(() =>
    ChildBinding.init({ args: [], toParentModel: makeParentModel }),
  ),
  update: OmittedParent.makeUpdate(model => ({ model })),
  EffectsLayer: Layer.empty,
})

const registeredDefinedUpdate = RegisteredParent.makeUpdate((model, message) =>
  ChildBinding.fold(model, message),
)
const registeredDefinitionUpdate = RegisteredParent.makeBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: registeredDefinedUpdate,
  EffectsLayer: Layer.empty,
})
const omittedDefinedUpdate = OmittedParent.makeUpdate((model, message) =>
  // @ts-expect-error A defined update cannot execute an unregistered child Binding.
  ChildBinding.fold(model, message),
)
// @ts-expect-error A defined update preserves the binding used by its result.
const omittedDefinitionUpdate = OmittedParent.makeBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: omittedDefinedUpdate,
  EffectsLayer: Layer.empty,
})

// @ts-expect-error A standalone Update cannot retain a child Binding before graph registration.
const genericUpdate = Update.define((model: ParentModel, message: Message) =>
  // @ts-expect-error A standalone Update cannot execute a child Binding before graph registration.
  ChildBinding.fold(model, message),
)

const branchUpdate = RegisteredParentBaseDefinition.step(
  (model, message: Message) =>
    message._tag === 'Advanced' ? ChildBinding.reset() : { model },
)
const registeredBranchDefinedUpdate = RegisteredParent.makeUpdate(
  (model, message) => branchUpdate(model, message),
)
const registeredBranchUpdate = RegisteredParent.makeBlock({
  init: RegisteredParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: registeredBranchDefinedUpdate,
  EffectsLayer: Layer.empty,
})
const omittedBranchDefinedUpdate = OmittedParent.makeUpdate((model, message) =>
  // @ts-expect-error A conditional child Step cannot execute without its registered Binding.
  branchUpdate(model, message),
)
// @ts-expect-error A union return retains registration from its child branch.
const omittedBranchUpdate = OmittedParent.makeBlock({
  init: OmittedParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: omittedBranchDefinedUpdate,
  EffectsLayer: Layer.empty,
})

const explicitlyAnnotatedUpdate = (model: ParentModel, message: Message) =>
  Message.match<Update.Return<ParentModel, Message>>(message, {
    // @ts-expect-error An explicit Return cannot erase child registration evidence.
    Advanced: () => {
      // @ts-expect-error An explicit Return cannot make a raw Model execute a connected Step.
      return ChildBinding.reset()(model)
    },
    Ignored: () => ({ model }),
  })

const explicitlyAnnotatedCallback = (
  model: ParentModel,
): Update.Return<ParentModel, Message> => {
  // @ts-expect-error An explicit callback return cannot make a raw Model execute a connected Step.
  return ChildBinding.reset()(model)
}

const mappedChildInit = () => {
  return ChildBinding.init({
    args: [],
    toParentModel: makeParentModel,
  })
}
// @ts-expect-error A passive init recipe does not expose a Model before interpretation.
mappedChildInit().model
// @ts-expect-error A passive init recipe does not expose Commands before interpretation.
mappedChildInit().commands
const registeredMappedInit = RegisteredParent.makeBlock({
  init: RegisteredParent.makeInit(mappedChildInit),
  update: RegisteredParent.makeUpdate(model => ({ model })),
  EffectsLayer: Layer.empty,
})
// @ts-expect-error mapMessages preserves child registration on the collection.
const omittedMappedInit = OmittedParent.makeBlock({
  init: OmittedParent.makeInit(mappedChildInit),
  update: OmittedParent.makeUpdate(model => ({ model })),
  EffectsLayer: Layer.empty,
})

const foldedChildInit = () =>
  Update.foldChildInit(
    // @ts-expect-error Standalone init folds do not interpret passive Binding recipes.
    ChildBinding.init({ args: [], toParentModel: makeParentModel }),
    {
      toParentModel: model => model,
      toParentMessage: (message: Message) => message,
    },
  )

const foldedChildInits = () =>
  Update.foldChildInits(
    {
      // @ts-expect-error Standalone init folds do not interpret passive Binding recipes.
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

const modelOnlyChildInit = ChildBinding.init({
  args: [],
  toParentModel: makeParentModel,
})
// @ts-expect-error A passive init recipe cannot be narrowed to its future Model.
modelOnlyChildInit.model

const UnusedChildParentBaseDefinition = define(
  'UnusedRegisteredChildParent',
).define({
  Model: ParentModel,
  Message: ParentMessage,
})
const UnusedRegisteredChildBinding = UnusedChildParentBaseDefinition.bindChild(
  ChildBlock,
  {
    placement: 'child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    parentMessage: ParentMessage.GotChildMessage,
  },
)
const UnusedChildParent = UnusedChildParentBaseDefinition.makeComposition({
  childBindings: [UnusedRegisteredChildBinding],
})
const RemovedUnusedChildParent = define('RemovedUnusedChildParent')
  .define({
    Model: ParentModel,
    Message,
  })
  .makeComposition()
const unusedChild = UnusedChildParent.makeBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})
const removedUnusedChild = RemovedUnusedChildParent.makeBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})

const KeyedParentMessage = defineMessageUnion({
  GotChildrenMessage: { key: Schema.Number, message: Message },
  Advanced: {},
  Ignored: {},
})

const RegisteredKeyedParentBaseDefinition = define(
  'RegisteredPureKeyedChildParent',
).define({
  Model: ParentModel,
  Message: KeyedParentMessage,
})
const ChildrenBinding = RegisteredKeyedParentBaseDefinition.bindChild(
  ChildBlock,
  {
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
    toParentMessage: (key, message) =>
      KeyedParentMessage.GotChildrenMessage({ key, message }),
    fromParentMessage: {
      parentMessage: KeyedParentMessage.GotChildrenMessage,
      args: (_model, { key, message }) => Option.some([key, message]),
    },
  },
)

const RegisteredKeyedParent =
  RegisteredKeyedParentBaseDefinition.makeComposition({
    childBindings: [ChildrenBinding],
  })
const OmittedKeyedParentBaseDefinition = define(
  'OmittedPureKeyedChildParent',
).define({
  Model: ParentModel,
  Message: KeyedParentMessage,
})
const AlternateChildrenBinding = OmittedKeyedParentBaseDefinition.bindChild(
  ChildBlock,
  {
    placement: 'alternate-children',
    readAll: model => model.children,
    key: child => child.count,
    read: child => child,
    writeAt: model => model,
    toParentMessage: (key, message) =>
      KeyedParentMessage.GotChildrenMessage({ key, message }),
    fromParentMessage: {
      parentMessage: KeyedParentMessage.GotChildrenMessage,
      args: (_model, { key, message }) => Option.some([key, message]),
    },
  },
)
const OmittedKeyedParent = OmittedKeyedParentBaseDefinition.makeComposition({
  childBindings: [AlternateChildrenBinding],
})

const registeredKeyedFold = RegisteredKeyedParent.makeBlock({
  init: RegisteredKeyedParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: RegisteredKeyedParent.makeUpdate((model, message) =>
    ChildrenBinding.fold(model, 0, message),
  ),
  EffectsLayer: Layer.empty,
})
// @ts-expect-error A keyed pure fold requires its registered collection.
const omittedKeyedFold = OmittedKeyedParent.makeBlock({
  init: OmittedKeyedParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: OmittedKeyedParent.makeUpdate((model, message) =>
    // @ts-expect-error A keyed fold cannot execute without its registered child Binding.
    ChildrenBinding.fold(model, 0, message),
  ),
  EffectsLayer: Layer.empty,
})

const registeredKeyedStep = RegisteredKeyedParent.makeBlock({
  init: RegisteredKeyedParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: RegisteredKeyedParent.makeUpdate(model =>
    ChildrenBinding.reset(0)(model),
  ),
  EffectsLayer: Layer.empty,
})
// @ts-expect-error A keyed pure Step requires its registered collection.
const omittedKeyedStep = OmittedKeyedParent.makeBlock({
  init: OmittedKeyedParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: OmittedKeyedParent.makeUpdate(model =>
    // @ts-expect-error A keyed Step cannot execute without its registered child Binding.
    ChildrenBinding.reset(0)(model),
  ),
  EffectsLayer: Layer.empty,
})

const registeredKeyedCombinedStep = RegisteredKeyedParent.makeBlock({
  init: RegisteredKeyedParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: RegisteredKeyedParent.makeUpdate(model =>
    Update.combine(model, [ChildrenBinding.reset(0)]),
  ),
  EffectsLayer: Layer.empty,
})
// @ts-expect-error combine preserves a keyed child Step's registration.
const omittedKeyedCombinedStep = OmittedKeyedParent.makeBlock({
  init: OmittedKeyedParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: OmittedKeyedParent.makeUpdate(model =>
    // @ts-expect-error combine cannot execute a keyed child Step without its registered Binding.
    Update.combine(model, [ChildrenBinding.reset(0)]),
  ),
  EffectsLayer: Layer.empty,
})

const registeredKeyedInit = RegisteredKeyedParent.makeBlock({
  init: RegisteredKeyedParent.makeInit(() =>
    ChildrenBinding.init({
      key: 0,
      args: [],
      toParentModel: makeParentModelWithChildOccurrence,
    }),
  ),
  update: RegisteredKeyedParent.makeUpdate(model => ({ model })),
  EffectsLayer: Layer.empty,
})
// @ts-expect-error Keyed init Commands retain their collection registration.
const omittedKeyedInit = OmittedKeyedParent.makeBlock({
  init: OmittedKeyedParent.makeInit(() =>
    ChildrenBinding.init({
      key: 0,
      args: [],
      toParentModel: makeParentModelWithChildOccurrence,
    }),
  ),
  update: OmittedKeyedParent.makeUpdate(model => ({ model })),
  EffectsLayer: Layer.empty,
})

const PolicyOutMessage = defineMessageUnion({ RequestedSecondaryReset: {} })
type PolicyOutMessage = typeof PolicyOutMessage.Type

const PolicyChildDefinition = define('RegistrationPolicyChild').define({
  Model: ChildModel,
  Message,
  OutMessage: PolicyOutMessage,
})
const PolicyChildBlock = PolicyChildDefinition.makeComposition().makeBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: model => ({
    model,
    outMessage: PolicyOutMessage.RequestedSecondaryReset(),
  }),
  EffectsLayer: Layer.empty,
})

const PolicyParentMessage = defineMessageUnion({
  GotPrimaryMessage: { message: Message },
  GotSecondaryMessage: { message: Message },
  Advanced: {},
  Ignored: {},
})
const PolicyParentBaseDefinition = define('RegisteredPolicyParent').define({
  Model: ParentModel,
  Message: PolicyParentMessage,
})
const SecondaryChildBinding = PolicyParentBaseDefinition.bindChild(ChildBlock, {
  placement: 'secondary-child',
  read: (model: ParentModel) => Option.some(model.child),
  write: (model, nextChild) => ParentModel.make({ ...model, child: nextChild }),
  parentMessage: PolicyParentMessage.GotSecondaryMessage,
})
const unsupportedNestedRawChildStep = Update.foldChildStep({
  // @ts-expect-error A raw child fold cannot erase a binding operation's registration.
  update: (model: ParentModel) => SecondaryChildBinding.reset()(model),
  read: (model: ParentModel) => Option.some(model),
  write: (_model, nextModel) => nextModel,
  toParentMessage: (message: Message) => message,
})
const PolicyChildBinding = PolicyParentBaseDefinition.bindChild(
  PolicyChildBlock,
  {
    placement: 'policy-child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    parentMessage: PolicyParentMessage.GotPrimaryMessage,
    outMessage: {
      fold: (_outMessage: PolicyOutMessage) =>
        PolicyParentBaseDefinition.step(() => SecondaryChildBinding.reset()),
    },
  },
)

const RegisteredPolicyParent = PolicyParentBaseDefinition.makeComposition({
  childBindings: [PolicyChildBinding, SecondaryChildBinding],
})
const OmittedPolicyParentBaseDefinition = define('OmittedPolicyParent').define({
  Model: ParentModel,
  Message: PolicyParentMessage,
})
const OmittedSecondaryChildBinding =
  OmittedPolicyParentBaseDefinition.bindChild(ChildBlock, {
    placement: 'secondary-child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    parentMessage: PolicyParentMessage.GotSecondaryMessage,
  })
const OmittedPolicyChildBinding = OmittedPolicyParentBaseDefinition.bindChild(
  PolicyChildBlock,
  {
    placement: 'policy-child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    parentMessage: PolicyParentMessage.GotPrimaryMessage,
    outMessage: {
      fold: (_outMessage: PolicyOutMessage) =>
        OmittedPolicyParentBaseDefinition.step(() =>
          OmittedSecondaryChildBinding.reset(),
        ),
    },
  },
)
const AlternateSecondaryChildBinding =
  OmittedPolicyParentBaseDefinition.bindChild(ChildBlock, {
    field: 'child',
    placement: 'alternate-secondary',
    parentMessage: PolicyParentMessage.GotSecondaryMessage,
    init: false,
  })
// @ts-expect-error An OutMessage policy retains nested child Step registration.
const OmittedPolicyParent = OmittedPolicyParentBaseDefinition.makeComposition({
  childBindings: [OmittedPolicyChildBinding, AlternateSecondaryChildBinding],
})
const registeredPolicyFold = RegisteredPolicyParent.makeBlock({
  init: RegisteredPolicyParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: RegisteredPolicyParent.makeUpdate((model, message) =>
    PolicyChildBinding.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})
const KeyedPolicyParentMessage = defineMessageUnion({
  GotPrimaryMessage: { key: Schema.Number, message: Message },
  GotSecondaryMessage: { key: Schema.Number, message: Message },
  Advanced: {},
  Ignored: {},
})
const KeyedPolicyParentBaseDefinition = define(
  'RegisteredKeyedPolicyParent',
).define({
  Model: ParentModel,
  Message: KeyedPolicyParentMessage,
})
const childModelKey = (childModel: ChildModel) => childModel.count
const SecondaryChildrenBinding = KeyedPolicyParentBaseDefinition.bindChild(
  ChildBlock,
  {
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
    toParentMessage: (key, message) =>
      KeyedPolicyParentMessage.GotSecondaryMessage({ key, message }),
    fromParentMessage: {
      parentMessage: KeyedPolicyParentMessage.GotSecondaryMessage,
      args: (_model, { key, message }) => Option.some([key, message]),
    },
  },
)
const PolicyChildrenBinding = KeyedPolicyParentBaseDefinition.bindChild(
  PolicyChildBlock,
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
    toParentMessage: (key, message) =>
      KeyedPolicyParentMessage.GotPrimaryMessage({ key, message }),
    fromParentMessage: {
      parentMessage: KeyedPolicyParentMessage.GotPrimaryMessage,
      args: (_model, { key, message }) => Option.some([key, message]),
    },
    outMessage: {
      fold: (_key: number, _outMessage: PolicyOutMessage) =>
        SecondaryChildrenBinding.reset(0),
    },
  },
)

const RegisteredKeyedPolicyParent =
  KeyedPolicyParentBaseDefinition.makeComposition({
    childBindings: [PolicyChildrenBinding, SecondaryChildrenBinding],
  })
const OmittedKeyedPolicyParentBaseDefinition = define(
  'OmittedKeyedPolicyParent',
).define({
  Model: ParentModel,
  Message: KeyedPolicyParentMessage,
})
const OmittedSecondaryChildrenBinding =
  OmittedKeyedPolicyParentBaseDefinition.bindChild(ChildBlock, {
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
    toParentMessage: (key, message) =>
      KeyedPolicyParentMessage.GotSecondaryMessage({ key, message }),
    fromParentMessage: {
      parentMessage: KeyedPolicyParentMessage.GotSecondaryMessage,
      args: (_model, { key, message }) => Option.some([key, message]),
    },
  })
const OmittedPolicyChildrenBinding =
  OmittedKeyedPolicyParentBaseDefinition.bindChild(PolicyChildBlock, {
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
    toParentMessage: (key, message) =>
      KeyedPolicyParentMessage.GotPrimaryMessage({ key, message }),
    fromParentMessage: {
      parentMessage: KeyedPolicyParentMessage.GotPrimaryMessage,
      args: (_model, { key, message }) => Option.some([key, message]),
    },
    outMessage: {
      fold: (_key: number, _outMessage: PolicyOutMessage) =>
        OmittedSecondaryChildrenBinding.reset(0),
    },
  })
const AlternateSecondaryChildrenBinding =
  OmittedKeyedPolicyParentBaseDefinition.bindChild(ChildBlock, {
    placement: 'alternate-secondary',
    readAll: model => model.children,
    key: child => child.count,
    read: child => child,
    writeAt: model => model,
    toParentMessage: (key, message) =>
      KeyedPolicyParentMessage.GotSecondaryMessage({ key, message }),
    fromParentMessage: {
      parentMessage: KeyedPolicyParentMessage.GotSecondaryMessage,
      args: (_model, { key, message }) => Option.some([key, message]),
    },
  })
const OmittedKeyedPolicyParent =
  // @ts-expect-error A keyed OutMessage policy retains child Step registration.
  OmittedKeyedPolicyParentBaseDefinition.makeComposition({
    childBindings: [
      OmittedPolicyChildrenBinding,
      AlternateSecondaryChildrenBinding,
    ],
  })
const registeredKeyedPolicyFold = RegisteredKeyedPolicyParent.makeBlock({
  init: RegisteredKeyedPolicyParent.makeInit(() => ({
    model: makeParentModel(ChildModel.make({ count: 0 })),
  })),
  update: RegisteredKeyedPolicyParent.makeUpdate((model, message) =>
    PolicyChildrenBinding.fold(model, 0, message),
  ),
  EffectsLayer: Layer.empty,
})
const FoldOutMessageParentBaseDefinition = define(
  'RegisteredFoldOutMessageInitParent',
).define({
  Model: ParentModel,
  Message: PolicyParentMessage,
})
const FoldOutMessageChildBinding = FoldOutMessageParentBaseDefinition.bindChild(
  ChildBlock,
  {
    placement: 'child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    parentMessage: PolicyParentMessage.GotPrimaryMessage,
  },
)
const FoldOutMessageSecondaryChildBinding =
  FoldOutMessageParentBaseDefinition.bindChild(ChildBlock, {
    placement: 'secondary-child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    parentMessage: PolicyParentMessage.GotSecondaryMessage,
  })
const RegisteredFoldOutMessageParent =
  FoldOutMessageParentBaseDefinition.makeComposition({
    childBindings: [
      FoldOutMessageChildBinding,
      FoldOutMessageSecondaryChildBinding,
    ],
  })
const OmittedFoldOutMessageParentBaseDefinition = define(
  'OmittedFoldOutMessageInitParent',
).define({
  Model: ParentModel,
  Message: PolicyParentMessage,
})
const OmittedFoldOutMessageChildBinding =
  OmittedFoldOutMessageParentBaseDefinition.bindChild(ChildBlock, {
    placement: 'child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
    parentMessage: PolicyParentMessage.GotPrimaryMessage,
  })
const AlternateInitPrimaryBinding =
  OmittedFoldOutMessageParentBaseDefinition.bindChild(ChildBlock, {
    field: 'child',
    placement: 'alternate-primary',
    parentMessage: PolicyParentMessage.GotPrimaryMessage,
    init: false,
  })
const AlternateInitSecondaryBinding =
  OmittedFoldOutMessageParentBaseDefinition.bindChild(ChildBlock, {
    field: 'child',
    placement: 'alternate-secondary',
    parentMessage: PolicyParentMessage.GotSecondaryMessage,
    init: false,
  })
const OmittedFoldOutMessageParent =
  OmittedFoldOutMessageParentBaseDefinition.makeComposition({
    childBindings: [AlternateInitPrimaryBinding, AlternateInitSecondaryBinding],
  })
const registeredFoldOutMessageInit = RegisteredFoldOutMessageParent.makeBlock({
  init: RegisteredFoldOutMessageParent.makeInit(() =>
    FoldOutMessageChildBinding.init({
      args: [],
      toParentModel: makeParentModel,
    }),
  ),
  update: RegisteredFoldOutMessageParent.makeUpdate(model => ({ model })),
  EffectsLayer: Layer.empty,
})
// @ts-expect-error A passive init recipe requires its registered child Binding at completion.
const omittedFoldOutMessageInit = OmittedFoldOutMessageParent.makeBlock({
  init: OmittedFoldOutMessageParent.makeInit(() =>
    OmittedFoldOutMessageChildBinding.init({
      args: [],
      toParentModel: makeParentModel,
    }),
  ),
  update: OmittedFoldOutMessageParent.makeUpdate(model => ({ model })),
  EffectsLayer: Layer.empty,
})
const passiveFoldOutMessageRecipe = FoldOutMessageChildBinding.init({
  args: [],
  toParentModel: makeParentModel,
})
Update.withOutMessage(
  // @ts-expect-error A passive init recipe cannot emit an OutMessage.
  passiveFoldOutMessageRecipe,
  PolicyOutMessage.RequestedSecondaryReset(),
)
Update.foldChildInit(
  // @ts-expect-error Standalone init folds do not interpret passive Binding recipes.
  passiveFoldOutMessageRecipe,
  {
    toParentModel: model => model,
    toParentMessage: (message: Message) => message,
    foldOutMessage: (_outMessage: PolicyOutMessage) =>
      FoldOutMessageSecondaryChildBinding.reset(),
  },
)
RegisteredFoldOutMessageParent.makeInit(() =>
  // @ts-expect-error Block init cannot emit an OutMessage.
  Update.withOutMessage(
    { model: makeParentModel(ChildModel.make({ count: 0 })) },
    PolicyOutMessage.RequestedSecondaryReset(),
  ),
)

const LifecycleOwner = define('RegistrationLifecycleChild')
const LifecycleDefinition = LifecycleOwner.define({
  Model: ChildModel,
  Message: Schema.Never,
})
const lifecycleSubscriptions = LifecycleDefinition.subscriptions(entry => ({
  idle: entry('Idle', {
    messages: [],
    handler: function* () {
      return () => Stream.never
    },
  }),
}))
const LifecycleChild = LifecycleDefinition.makeComposition().makeBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: model => ({ model }),
  subscriptions: lifecycleSubscriptions,
  EffectsLayer: lifecycleSubscriptions.idle.layer,
})
const LifecycleOnlyParentBaseDefinition = define(
  'LifecycleOnlyChildParent',
).define({
  Model: ParentModel,
  Message,
})
const LifecycleChildBinding = LifecycleOnlyParentBaseDefinition.bindChild(
  LifecycleChild,
  {
    placement: 'lifecycle-child',
    read: (model: ParentModel) => Option.some(model.child),
    write: (model, nextChild) =>
      ParentModel.make({ ...model, child: nextChild }),
  },
)

const LifecycleOnlyParent = LifecycleOnlyParentBaseDefinition.makeComposition({
  childBindings: [LifecycleChildBinding],
})
const RemovedLifecycleParent = define('RemovedLifecycleChildParent')
  .define({
    Model: ParentModel,
    Message,
  })
  .makeComposition()
const lifecycleOnlyChild = LifecycleOnlyParent.makeBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})
const removedLifecycleChild = RemovedLifecycleParent.makeBlock({
  init: () => ({ model: makeParentModel(ChildModel.make({ count: 0 })) }),
  update: model => ({ model }),
  EffectsLayer: Layer.empty,
})

const childResultWithOutMessage = (
  model: Parameters<ReturnType<typeof ChildBinding.reset>>[0],
) => Update.withOutMessage(ChildBinding.reset()(model), Message.Advanced())

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
void genericUpdate
void registeredBranchUpdate
void omittedBranchUpdate
void explicitlyAnnotatedUpdate
void explicitlyAnnotatedCallback
void registeredMappedInit
void omittedMappedInit
void foldedChildInit
void foldedChildInits
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
void OmittedPolicyParent
void registeredKeyedPolicyFold
void OmittedKeyedPolicyParent
void registeredFoldOutMessageInit
void omittedFoldOutMessageInit
void lifecycleOnlyChild
void removedLifecycleChild

it('keeps the declared child graph independent from operation use', () => {
  expect(registeredFold.childBindings).toEqual([ChildBinding])
  expect(removedUnusedChild.childBindings).toEqual([])
  expect(lifecycleOnlyChild.childBindings).toEqual([LifecycleChildBinding])
  expect(removedLifecycleChild.childBindings).toEqual([])
  expectTypeOf<
    Update.RegistrationEvidenceOf<ReturnType<typeof childResultWithOutMessage>>
  >().toEqualTypeOf<BindingRequirement<'child', typeof ChildBlock>>()
  expectTypeOf<
    Update.RequirementsOf<typeof childResultWithOutMessage>
  >().toEqualTypeOf<never>()
})
