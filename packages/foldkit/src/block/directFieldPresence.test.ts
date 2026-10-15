import { Option, Schema } from 'effect'
import { expect, expectTypeOf, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { taggedStruct } from '../schema/index.js'
import { modifyFields } from '../struct/index.js'
import { define } from './define.js'

const ChildModel = Schema.Struct({ count: Schema.Number })
const ChildMessage = defineMessageUnion({
  UpdatedCount: { count: Schema.Number },
})
const Child = define('DirectPresenceChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const setCount = Child.step((model, count: number) => ({
  model: modifyFields(model, { count: () => count }),
}))
const childBlock = Child.toComposition().toBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: Child.update((model, { count }) => setCount(model, count)),
  expose: { setCount },
})
const Model = Schema.Struct({
  child: ChildModel,
  maybeChild: Schema.Option(ChildModel),
  route: Schema.Literals(['Home', 'Away']),
})
type Model = typeof Model.Type
const Message = defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
})
const Parent = define('DirectPresenceParent', { Model, Message })
const optional = Parent.bindChild(childBlock, {
  field: 'maybeChild',
  parentMessage: Message.GotChildMessage,
})
const gated = Parent.bindChild(childBlock, {
  field: 'child',
  presentWhen: model => {
    expectTypeOf(model).toEqualTypeOf<Model>()
    return model.route === 'Home'
  },
  parentMessage: Message.GotChildMessage,
})
const composition = Parent.toComposition({ children: [optional, gated] })
const update = composition.update((model, message) =>
  Message.match(message, {
    GotChildMessage: ({ message }) => optional.fold(model, message),
  }),
)
const initial = Model.make({
  child: ChildModel.make({ count: 1 }),
  maybeChild: Option.some(ChildModel.make({ count: 2 })),
  route: 'Home',
})

it('folds exact Option fields without creating absent children', () => {
  expectTypeOf(optional.placement).toEqualTypeOf<'maybeChild'>()
  const changed = update(
    initial,
    Message.GotChildMessage({
      message: ChildMessage.UpdatedCount({ count: 3 }),
    }),
  )
  expect(changed.model.maybeChild).toEqual(
    Option.some(ChildModel.make({ count: 3 })),
  )
  expect(optional.setCount(4)(initial).model.maybeChild).toEqual(
    Option.some(ChildModel.make({ count: 4 })),
  )

  const absent = modifyFields(initial, { maybeChild: () => Option.none() })
  expect(
    optional.fold(absent, ChildMessage.UpdatedCount({ count: 9 })).model,
  ).toBe(absent)
  expect(optional.setCount(9)(absent).model).toBe(absent)
})

it('makes direct stored children absent through presentWhen without deleting their state', () => {
  expect(gated.setCount(3)(initial).model.child.count).toBe(3)
  const away: Model = modifyFields(initial, { route: () => 'Away' })
  expect(gated.fold(away, ChildMessage.UpdatedCount({ count: 9 })).model).toBe(
    away,
  )
  expect(gated.setCount(9)(away).model).toBe(away)
  expect(away.child.count).toBe(1)
  const returned = modifyFields(away, { route: () => 'Home' })
  expect(gated.setCount(5)(returned).model.child.count).toBe(5)
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
  const block = OptionChild.toComposition().toBlock({
    init: () => ({ model: Option.none<string>() }),
    update: OptionChild.update((_model, { text }) => ({
      model: Option.some(text),
    })),
  })
  const Model = Schema.Struct({
    required: Schema.Option(Schema.String),
    maybe: Schema.Option(OptionModel),
  })
  const Message = defineMessageUnion({
    GotChildMessage: { message: OptionMessage },
  })
  const Parent = define('DirectPresenceOptionParent', { Model, Message })
  const required = Parent.bindChild(block, {
    field: 'required',
    parentMessage: Message.GotChildMessage,
  })
  const optional = Parent.bindChild(block, {
    field: 'maybe',
    parentMessage: Message.GotChildMessage,
  })
  Parent.toComposition({ children: [required, optional] })
  const initial = Model.make({ required: Option.none(), maybe: Option.none() })
  expect(
    required.fold(initial, OptionMessage.UpdatedText({ text: 'changed' })).model
      .required,
  ).toEqual(Option.some('changed'))
  expect(
    optional.fold(initial, OptionMessage.UpdatedText({ text: 'ignored' }))
      .model,
  ).toBe(initial)
})

it('reports invalid erased direct configurations during binding creation', () => {
  const bind = (config: unknown) =>
    Reflect.apply(Parent.bindChild, Parent, [childBlock, config])
  expect(() =>
    bind({ field: 'missing', parentMessage: Message.GotChildMessage }),
  ).toThrow(/declared Struct Model field/)
  expect(() =>
    bind({
      field: 'child',
      read: () => Option.some(initial.child),
      parentMessage: Message.GotChildMessage,
    }),
  ).toThrow(/cannot also supply/)
  expect(() =>
    bind({
      field: 'child',
      write: () => initial,
      parentMessage: Message.GotChildMessage,
    }),
  ).toThrow(/cannot also supply/)
  expect(() =>
    bind({
      field: 'child',
      presentWhen: true,
      parentMessage: Message.GotChildMessage,
    }),
  ).toThrow(/presentWhen must be/)
  expect(() => bind({ field: 'child' })).toThrow(
    /parentMessage constructor or a toParentMessage function/,
  )
  expect(() =>
    bind({
      field: 'child',
      parentMessage: Message.GotChildMessage,
      toParentMessage: () =>
        Message.GotChildMessage({
          message: ChildMessage.UpdatedCount({ count: 0 }),
        }),
    }),
  ).toThrow(/exactly one/)
})

it('preserves absence through a suspended Option storage schema', () => {
  const SuspendedModel = Schema.Struct({
    maybeChild: Schema.suspend(() => Schema.Option(ChildModel)),
  })
  const Suspended = define('DirectPresenceSuspended', {
    Model: SuspendedModel,
    Message,
  })
  const child = Suspended.bindChild(childBlock, {
    field: 'maybeChild',
    parentMessage: Message.GotChildMessage,
  })
  Suspended.toComposition({ children: [child] })
  const absent = SuspendedModel.make({ maybeChild: Option.none() })
  expect(
    child.fold(absent, ChildMessage.UpdatedCount({ count: 2 })).model,
  ).toBe(absent)
  const present = SuspendedModel.make({
    maybeChild: Option.some(ChildModel.make({ count: 1 })),
  })
  expect(child.setCount(3)(present).model.maybeChild).toEqual(
    Option.some(ChildModel.make({ count: 3 })),
  )
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
      bind({ field, parentMessage: Message.GotChildMessage }),
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
    bindParent({ field: 'child', parentMessage: () => ({}) }),
  ).toThrow(/callable Message Schema/)
  expect(() =>
    bindParent({
      field: 'child',
      parentMessage: Wrappers.GotOptionalExtraMessage,
    }),
  ).toThrow(/only the message payload/)
  expect(() =>
    bindParent({ field: 'child', parentMessage: Wrappers.GotWrongMessage }),
  ).toThrow(/bound child Message Schema/)
  expect(() =>
    bindParent({
      field: 'child',
      presentWhem: () => true,
      parentMessage: Message.GotChildMessage,
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
    bind({ field: 'child', parentMessage: Foreign.ReceivedChildMessage }),
  ).toThrow(/declared by the parent Message Schema/)
  const spoof = (_fields: unknown) => ({})
  Reflect.setPrototypeOf(spoof, Message.GotChildMessage)
  expect(() => bind({ field: 'child', parentMessage: spoof })).toThrow(
    /callable Message Schema/,
  )
  const invalidPresence = bind({
    field: 'child',
    presentWhen: () => 'Home',
    parentMessage: Message.GotChildMessage,
  })
  const fold = Reflect.get(invalidPresence, 'fold')
  expect(() =>
    Reflect.apply(fold, invalidPresence, [
      initial,
      ChildMessage.UpdatedCount({ count: 1 }),
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
          Message.GotChildMessage({ message }),
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
  const child = Parent.bindChild(childBlock, {
    field: 'child',
    parentMessage: Message.GotChildMessage,
  })
  const optional = Parent.bindChild(childBlock, {
    field: 'maybeChild',
    parentMessage: Message.GotChildMessage,
  })
  Parent.toComposition({ children: [child, optional] })
  const initial = Model({
    child: ChildModel.make({ count: 1 }),
    maybeChild: Option.none(),
  })
  expect(child.setCount(2)(initial).model).toEqual(
    Model({ child: ChildModel.make({ count: 2 }), maybeChild: Option.none() }),
  )
  expect(optional.setCount(2)(initial).model).toBe(initial)
})

it('rejects ignored Model overrides on parent-owned direct fields', () => {
  for (const field of ['Model', 'ChildModel']) {
    expect(() =>
      Reflect.apply(Parent.bindChild, Parent, [
        childBlock,
        {
          field: 'child',
          parentMessage: Message.GotChildMessage,
          [field]: Schema.String,
        },
      ]),
    ).toThrow(/parent-owned field Binding cannot supply/)
  }
})
