import { Option, Predicate, Schema, Tuple } from 'effect'
import { expect, expectTypeOf, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { taggedStruct } from '../schema/index.js'
import { modifyFields } from '../struct/index.js'
import { define } from './define.js'

const ChildModel = Schema.Struct({ count: Schema.Number })
const ChildMessage = defineMessageUnion({
  RequestedSetCount: { count: Schema.Number },
  UpdatedCount: { count: Schema.Number },
})
const Child = define('DirectPresenceChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const setCount = Child.step((model, count: number) => ({
  model: modifyFields(model, { count: () => count }),
}))
const ChildComposition = Child.makeComposition()
const childBlock = ChildComposition.makeBlock({
  init: ChildComposition.makeInit(() => ({
    model: ChildModel.make({ count: 0 }),
  })),
  update: ChildComposition.makeUpdate((model, message) =>
    ChildMessage.match(message, {
      RequestedSetCount: ({ count }) => setCount(model, count),
      UpdatedCount: ({ count }) => setCount(model, count),
    }),
  ),
  operations: {
    setCount: (count: number) =>
      Tuple.make(ChildMessage.RequestedSetCount({ count })),
  },
})
const Model = Schema.Struct({
  child: ChildModel,
  maybeChild: Schema.Option(ChildModel),
  route: Schema.Literals(['Home', 'Away']),
})
type Model = typeof Model.Type
const Message = defineMessageUnion({
  GotOptionalChildMessage: { message: ChildMessage },
  GotGatedChildMessage: { message: ChildMessage },
  RequestedSetOptionalCount: { count: Schema.Number },
  RequestedSetGatedCount: { count: Schema.Number },
})
const Parent = define('DirectPresenceParent', { Model, Message })
const OptionalBinding = Parent.bindChild(childBlock, {
  field: 'maybeChild',
  parentMessage: Message.GotOptionalChildMessage,
})
const GatedBinding = Parent.bindChild(childBlock, {
  field: 'child',
  presentWhen: model => {
    expectTypeOf(model).toEqualTypeOf<Model>()
    return model.route === 'Home'
  },
  parentMessage: Message.GotGatedChildMessage,
})
const composition = Parent.makeComposition({
  childBindings: [OptionalBinding, GatedBinding],
})
const update = composition.makeUpdate((model, message) =>
  Message.match(message, {
    RequestedSetOptionalCount: ({ count }) =>
      OptionalBinding.setCount(count)(model),
    RequestedSetGatedCount: ({ count }) => GatedBinding.setCount(count)(model),
  }),
)
const initial = Model.make({
  child: ChildModel.make({ count: 1 }),
  maybeChild: Option.some(ChildModel.make({ count: 2 })),
  route: 'Home',
})

const gatedUpdate = update
const parent = composition.makeBlock({
  init: () => ({ model: initial }),
  update,
  operations: {
    setOptionalCount: (count: number) =>
      Tuple.make(Message.RequestedSetOptionalCount({ count })),
    setGatedCount: (count: number) =>
      Tuple.make(Message.RequestedSetGatedCount({ count })),
  },
})

it('folds exact Option fields without creating absent children', () => {
  expectTypeOf(OptionalBinding.placement).toEqualTypeOf<'maybeChild'>()
  const changed = update(
    initial,
    Message.GotOptionalChildMessage({
      message: ChildMessage.UpdatedCount({ count: 3 }),
    }),
  )
  expect(changed.model.maybeChild).toEqual(
    Option.some(ChildModel.make({ count: 3 })),
  )
  expect(
    parent.operations.setOptionalCount(initial, 4).model.maybeChild,
  ).toEqual(Option.some(ChildModel.make({ count: 4 })))

  const absent = modifyFields(initial, { maybeChild: () => Option.none() })
  expect(
    update(
      absent,
      Message.GotOptionalChildMessage({
        message: ChildMessage.UpdatedCount({ count: 9 }),
      }),
    ).model,
  ).toBe(absent)
  expect(parent.operations.setOptionalCount(absent, 9).model).toBe(absent)
})

it('makes direct stored children absent through presentWhen without deleting their state', () => {
  expect(parent.operations.setGatedCount(initial, 3).model.child.count).toBe(3)
  const away: Model = modifyFields(initial, { route: () => 'Away' })
  expect(
    gatedUpdate(
      away,
      Message.GotGatedChildMessage({
        message: ChildMessage.UpdatedCount({ count: 9 }),
      }),
    ).model,
  ).toBe(away)
  expect(parent.operations.setGatedCount(away, 9).model).toBe(away)
  expect(away.child.count).toBe(1)
  const returned = modifyFields(away, { route: () => 'Home' })
  expect(parent.operations.setGatedCount(returned, 5).model.child.count).toBe(5)
})

it('distinguishes Option child Models from optional storage wrappers', () => {
  const OptionModel = Schema.Option(Schema.String)
  const OptionMessage = defineMessageUnion({
    UpdatedText: { text: Schema.String },
  })
  const OptionChild = define('DirectPresenceOptionModel', {
    Model: OptionModel,
    Message: OptionMessage,
  })
  const OptionChildComposition = OptionChild.makeComposition()
  const block = OptionChildComposition.makeBlock({
    init: OptionChildComposition.makeInit(() => ({
      model: Option.none<string>(),
    })),
    update: OptionChildComposition.makeUpdate((_model, { text }) => ({
      model: Option.some(text),
    })),
  })
  const Model = Schema.Struct({
    required: Schema.Option(Schema.String),
    maybe: Schema.Option(OptionModel),
  })
  const Message = defineMessageUnion({
    GotRequiredChildMessage: { message: OptionMessage },
    GotOptionalChildMessage: { message: OptionMessage },
  })
  const Parent = define('DirectPresenceOptionParent', { Model, Message })
  const RequiredBinding = Parent.bindChild(block, {
    field: 'required',
    parentMessage: Message.GotRequiredChildMessage,
  })
  const OptionalBinding = Parent.bindChild(block, {
    field: 'maybe',
    parentMessage: Message.GotOptionalChildMessage,
  })
  const Composition = Parent.makeComposition({
    childBindings: [RequiredBinding, OptionalBinding],
  })
  const updateRequired = Composition.makeUpdate()
  const updateOptional = updateRequired
  const initial = Model.make({ required: Option.none(), maybe: Option.none() })
  expect(
    updateRequired(
      initial,
      Message.GotRequiredChildMessage({
        message: OptionMessage.UpdatedText({ text: 'changed' }),
      }),
    ).model.required,
  ).toEqual(Option.some('changed'))
  expect(
    updateOptional(
      initial,
      Message.GotOptionalChildMessage({
        message: OptionMessage.UpdatedText({ text: 'ignored' }),
      }),
    ).model,
  ).toBe(initial)
})

it('reports invalid erased direct configurations during binding creation', () => {
  const bind = (config: unknown) =>
    Reflect.apply(Parent.bindChild, Parent, [childBlock, config])
  expect(() =>
    bind({
      field: 'missing',
      parentMessage: Message.GotOptionalChildMessage,
    }),
  ).toThrow(/declared Struct Model field/)
  expect(() =>
    bind({
      field: 'child',
      read: () => Option.some(initial.child),
      parentMessage: Message.GotOptionalChildMessage,
    }),
  ).toThrow(/cannot also supply/)
  expect(() =>
    bind({
      field: 'child',
      write: () => initial,
      parentMessage: Message.GotOptionalChildMessage,
    }),
  ).toThrow(/cannot also supply/)
  expect(() =>
    bind({
      field: 'child',
      presentWhen: true,
      parentMessage: Message.GotOptionalChildMessage,
    }),
  ).toThrow(/presentWhen must be/)
  expect(() =>
    bind({
      field: 'child',
      parentMessage: Message.GotOptionalChildMessage,
      fromParentMessage: false,
    }),
  ).toThrow(/fromParentMessage must be an object/)
  expect(() =>
    bind({
      field: 'child',
      parentMessage: Message.GotOptionalChildMessage,
      toParentMessage: () =>
        Message.GotOptionalChildMessage({
          message: ChildMessage.UpdatedCount({ count: 0 }),
        }),
    }),
  ).toThrow(/exactly one/)
})

it('preserves absence through a suspended Option storage schema', () => {
  const SuspendedModel = Schema.Struct({
    maybeChild: Schema.suspend(() => Schema.Option(ChildModel)),
  })
  const SuspendedMessage = defineMessageUnion({
    GotChildMessage: { message: ChildMessage },
  })
  const Suspended = define('DirectPresenceSuspended', {
    Model: SuspendedModel,
    Message: SuspendedMessage,
  })
  const ChildBinding = Suspended.bindChild(childBlock, {
    field: 'maybeChild',
    parentMessage: SuspendedMessage.GotChildMessage,
  })
  const Composition = Suspended.makeComposition({
    childBindings: [ChildBinding],
  })
  const update = Composition.makeUpdate()
  const absent = SuspendedModel.make({ maybeChild: Option.none() })
  expect(
    update(
      absent,
      SuspendedMessage.GotChildMessage({
        message: ChildMessage.UpdatedCount({ count: 2 }),
      }),
    ).model,
  ).toBe(absent)
  const present = SuspendedModel.make({
    maybeChild: Option.some(ChildModel.make({ count: 1 })),
  })
  expect(
    update(
      present,
      SuspendedMessage.GotChildMessage({
        message: ChildMessage.UpdatedCount({ count: 3 }),
      }),
    ).model.maybeChild,
  ).toEqual(Option.some(ChildModel.make({ count: 3 })))
})

it('rejects structurally incompatible storage and invalid wrapper constructors before binding', () => {
  const InvalidModel = Schema.Struct({
    number: Schema.Number,
    wrongOption: Schema.Option(Schema.String),
  })
  const Invalid = define('DirectPresenceInvalid', {
    Model: InvalidModel,
    Message,
  })
  const bind = (config: unknown) =>
    Reflect.apply(Invalid.bindChild, Invalid, [childBlock, config])
  for (const field of ['number', 'wrongOption']) {
    expect(() =>
      bind({
        field,
        parentMessage: Message.GotOptionalChildMessage,
      }),
    ).toThrow(/must store the declared child Model/)
  }

  const bindParent = (config: unknown) =>
    Reflect.apply(Parent.bindChild, Parent, [childBlock, config])
  const Wrappers = defineMessageUnion({
    GotOptionalExtraMessage: {
      message: ChildMessage,
      requestId: Schema.optionalKey(Schema.String),
    },
    GotWrongMessage: { message: Schema.String },
  })
  expect(() =>
    bindParent({
      field: 'child',
      parentMessage: () => ({}),
    }),
  ).toThrow(/callable Message Schema/)
  expect(() =>
    bindParent({
      field: 'child',
      parentMessage: Wrappers.GotOptionalExtraMessage,
    }),
  ).toThrow(/only the message payload/)
  expect(() =>
    bindParent({
      field: 'child',
      parentMessage: Wrappers.GotWrongMessage,
    }),
  ).toThrow(/bound child Message Schema/)
  expect(() =>
    bindParent({
      field: 'child',
      presentWhem: () => true,
      parentMessage: Message.GotOptionalChildMessage,
    }),
  ).toThrow(/Unknown Binding configuration field "presentWhem"/)
})

it('rejects erased foreign wrappers and nonboolean presence policies', () => {
  const bind = (config: unknown) =>
    Reflect.apply(Parent.bindChild, Parent, [childBlock, config])
  const Foreign = defineMessageUnion({
    ReceivedChildMessage: { message: ChildMessage },
  })
  expect(() =>
    bind({
      field: 'child',
      parentMessage: Foreign.ReceivedChildMessage,
    }),
  ).toThrow(/declared by the parent Message Schema/)
  const spoof = (_fields: unknown) => ({})
  Reflect.setPrototypeOf(spoof, Message.GotOptionalChildMessage)
  expect(() => bind({ field: 'child', parentMessage: spoof })).toThrow(
    /callable Message Schema/,
  )
  const InvalidPresenceBinding = bind({
    placement: 'invalid-child',
    field: 'child',
    presentWhen: () => 'Home',
    parentMessage: Message.GotOptionalChildMessage,
    init: false,
  })
  const Composition = Reflect.apply(Parent.makeComposition, undefined, [
    { childBindings: [InvalidPresenceBinding, GatedBinding] },
  ])
  const invalidUpdate = Reflect.apply(
    Reflect.get(Composition, 'makeUpdate'),
    undefined,
    [],
  )

  if (!Predicate.isFunction(invalidUpdate)) {
    throw new Error(
      'Expected the erased Composition to produce an update function',
    )
  }

  expect(() =>
    Reflect.apply(invalidUpdate, undefined, [
      initial,
      Message.GotOptionalChildMessage({
        message: ChildMessage.UpdatedCount({ count: 1 }),
      }),
    ]),
  ).toThrow(/must return a boolean/)
})

it('rejects ignored keyed adapters on erased accessor configs', () => {
  const bind = (config: unknown) =>
    Reflect.apply(Parent.bindChild, Parent, [childBlock, config])
  for (const field of ['Model', 'key', 'writeAt']) {
    expect(() =>
      bind({
        read: (model: Model) => Option.some(model.child),
        write: (model: Model) => model,
        toParentMessage: (message: typeof ChildMessage.Type) =>
          Message.GotOptionalChildMessage({ message }),
        [field]: () => initial,
      }),
    ).toThrow(/accessor Binding cannot supply/)
  }
})

it('reads direct fields from callable tagged Struct parent Models', () => {
  const Model = taggedStruct('CallableParent', {
    child: ChildModel,
    maybeChild: Schema.Option(ChildModel),
  })
  const Parent = define('DirectPresenceCallableParent', { Model, Message })
  const ChildBinding = Parent.bindChild(childBlock, {
    field: 'child',
    parentMessage: Message.GotGatedChildMessage,
  })
  const OptionalBinding = Parent.bindChild(childBlock, {
    field: 'maybeChild',
    parentMessage: Message.GotOptionalChildMessage,
  })
  const Composition = Parent.makeComposition({
    childBindings: [ChildBinding, OptionalBinding],
  })
  const updateChild = Composition.makeUpdate(model => ({ model }))
  const updateOptional = updateChild
  const initial = Model({
    child: ChildModel.make({ count: 1 }),
    maybeChild: Option.none(),
  })
  expect(
    updateChild(
      initial,
      Message.GotGatedChildMessage({
        message: ChildMessage.UpdatedCount({ count: 2 }),
      }),
    ).model,
  ).toEqual(
    Model({ child: ChildModel.make({ count: 2 }), maybeChild: Option.none() }),
  )
  expect(
    updateOptional(
      initial,
      Message.GotOptionalChildMessage({
        message: ChildMessage.UpdatedCount({ count: 2 }),
      }),
    ).model,
  ).toBe(initial)
})

it('rejects ignored Model overrides on parent-owned direct fields', () => {
  for (const field of ['Model', 'ChildModel']) {
    expect(() =>
      Reflect.apply(Parent.bindChild, Parent, [
        childBlock,
        {
          field: 'child',
          parentMessage: Message.GotOptionalChildMessage,
          [field]: Schema.String,
        },
      ]),
    ).toThrow(/parent-owned field Binding cannot supply/)
  }
})
