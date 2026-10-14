import { Array, Layer, Option, Schema } from 'effect'
import { expect, expectTypeOf, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { define as defineApplication } from '../runtime/applicationPublic.js'
import { modifyFields } from '../struct/index.js'
import type * as Update from '../update/index.js'
import { define } from './define.js'

const ChildModel = Schema.Struct({ value: Schema.String })
type ChildModel = typeof ChildModel.Type
const ChildMessage = defineMessageUnion({
  UpdatedValue: { value: Schema.String },
})
type ChildMessage = typeof ChildMessage.Type
const ChildOutMessage = defineMessageUnion({
  SelectedValue: { value: Schema.String },
})
type ChildOutMessage = typeof ChildOutMessage.Type

type CommandMessageOfReturn<Value> =
  Value extends Readonly<{
    commands?: Update.Commands<infer Message, any> | undefined
  }>
    ? Message
    : never

const ChildDefinition = define('ParentOwnedBindingChild', {
  Model: ChildModel,
  Message: ChildMessage,
  OutMessage: ChildOutMessage,
})
const selectValue = ChildDefinition.step(model => ({
  model,
  outMessage: ChildOutMessage.SelectedValue({ value: model.value }),
}))
const ChildComposition = ChildDefinition.toComposition()
const ChildBlock = ChildComposition.toBlock({
  init: () => ({ model: ChildModel.make({ value: 'initial' }) }),
  update: ChildDefinition.update((model, { value }) => ({
    model: modifyFields(model, { value: () => value }),
  })),
  expose: { selectValue },
})

const PlainChildDefinition = define('ParentOwnedBindingPlainChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const PlainChildBlock = PlainChildDefinition.toComposition().toBlock({
  init: () => ({ model: ChildModel.make({ value: 'initial' }) }),
  update: PlainChildDefinition.update((model, { value }) => ({
    model: modifyFields(model, { value: () => value }),
  })),
})

const setPrototypeValue = PlainChildDefinition.step((model, value: string) => ({
  model: modifyFields(model, { value: () => value }),
}))

const PrototypeOperationChildBlock =
  PlainChildDefinition.toComposition().toBlock({
    init: PlainChildBlock.init,
    update: PlainChildBlock.update,
    expose: { ['__proto__']: setPrototypeValue },
  })

const Entry = Schema.Struct({ id: Schema.Number, child: ChildModel })
type Entry = typeof Entry.Type
const ChildSlot = Schema.TaggedStruct('Child', { child: ChildModel })
const EmptySlot = Schema.TaggedStruct('Empty', {})
const Slot = Schema.Union([ChildSlot, EmptySlot])
const ParentModel = Schema.Struct({
  child: ChildModel,
  maybeChild: Schema.Option(ChildModel),
  slot: Slot,
  entries: Schema.Array(Entry),
  selected: Schema.Option(Schema.String),
})
type ParentModel = typeof ParentModel.Type
const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
  GotKeyedChildMessage: { id: Schema.Number, message: ChildMessage },
})
type ParentMessage = typeof ParentMessage.Type
const ParentOutMessage = defineMessageUnion({
  ForwardedSelectedValue: { value: Schema.String },
})
type ParentOutMessage = typeof ParentOutMessage.Type

const ParentDefinition = define('ParentOwnedBindingParent', {
  Model: ParentModel,
  Message: ParentMessage,
  OutMessage: ParentOutMessage,
})

const exactMessageChild = ParentDefinition.bindChild(PlainChildBlock, {
  field: 'child',
  placement: 'exactMessageChild',
  parentMessage: ParentMessage.GotChildMessage,
})

const exactCustomMessageChild = ParentDefinition.bindChild(PlainChildBlock, {
  placement: 'exactCustomMessageChild',
  read: model => model.maybeChild,
  write: (model, nextChild) =>
    modifyFields(model, { maybeChild: () => Option.some(nextChild) }),
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
})

const foldChildOutMessage = ChildOutMessage.match<
  Update.Step<ParentModel, ParentMessage>,
  ChildOutMessage
>({
  SelectedValue:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { selected: () => Option.some(value) }),
    }),
})

const directChild = ParentDefinition.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: { fold: foldChildOutMessage },
})

const forwardingChild = ParentDefinition.bindChild(ChildBlock, {
  field: 'child',
  placement: 'forwardingChild',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: {
    forward: outMessage => {
      expectTypeOf(outMessage).toEqualTypeOf<ChildOutMessage>()

      return ChildOutMessage.match<ParentOutMessage>(outMessage, {
        SelectedValue: ({ value }) =>
          ParentOutMessage.ForwardedSelectedValue({ value }),
      })
    },
  },
})

const optionalChild = ParentDefinition.bindChild(ChildBlock, {
  placement: 'optionalChild',
  read: model => model.maybeChild,
  write: (model, nextChild) =>
    modifyFields(model, { maybeChild: () => Option.some(nextChild) }),
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
  outMessage: {
    fold: (outMessage, context) => {
      expectTypeOf(outMessage).toEqualTypeOf<ChildOutMessage>()
      expectTypeOf(context).toEqualTypeOf<
        Update.FoldContext<ChildMessage, ParentMessage, ParentModel>
      >()

      return foldChildOutMessage(outMessage)
    },
  },
})

const taggedChild = ParentDefinition.bindChild(ChildBlock, {
  placement: 'taggedChild',
  read: model =>
    model.slot._tag === 'Child' ? Option.some(model.slot.child) : Option.none(),
  write: (model, nextChild) =>
    modifyFields(model, {
      slot: () => ChildSlot.make({ child: nextChild }),
    }),
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: { fold: foldChildOutMessage },
})

const keyedChild = ParentDefinition.bindChild(ChildBlock, {
  placement: 'entries',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: (model, id, nextChild) =>
    modifyFields(model, {
      entries: Array.map(entry =>
        entry.id === id
          ? Entry.make({ id: entry.id, child: nextChild })
          : entry,
      ),
    }),
  toParentMessage: (id, message) =>
    ParentMessage.GotKeyedChildMessage({ id, message }),
  outMessage: {
    fold: (id, outMessage, context) => {
      expectTypeOf(id).toEqualTypeOf<number>()
      expectTypeOf(outMessage).toEqualTypeOf<ChildOutMessage>()
      expectTypeOf(context).toEqualTypeOf<
        Update.FoldContext<ChildMessage, ParentMessage, ParentModel>
      >()

      return foldChildOutMessage(outMessage)
    },
  },
})

const ParentComposition = ParentDefinition.toComposition({
  children: [directChild, optionalChild, taggedChild, keyedChild],
})

const update = ParentDefinition.update((model, message) =>
  ParentMessage.match(message, {
    GotChildMessage: ({ message }) => directChild.fold(model, message),
    GotKeyedChildMessage: ({ id, message }) =>
      keyedChild.fold(model, id, message),
  }),
)

const ParentBlock = ParentComposition.toBlock({
  init: () => {
    const childInit = directChild.init()

    return {
      model: ParentModel.make({
        child: childInit.model,
        maybeChild: Option.none(),
        slot: EmptySlot.make({}),
        entries: [],
        selected: Option.none(),
      }),
    }
  },
  update,
})

const makeGenericChoice = <const Value extends string>(
  Value: Schema.Schema<Value>,
) => {
  const Model = Schema.Struct({ value: Value })
  const Message = defineMessageUnion({ UpdatedChoice: { value: Value } })
  const OutMessage = defineMessageUnion({ SelectedChoice: { value: Value } })
  const GenericChoiceDefinition = define('ParentOwnedGenericChoice').define({
    Model,
    Message,
    OutMessage,
  })
  const GenericChoiceComposition = GenericChoiceDefinition.toComposition()
  const block = GenericChoiceComposition.toBlock({
    init: (value: Value) => ({ model: Model.make({ value }) }),
    update: GenericChoiceDefinition.update((model, { value }) => ({
      model: modifyFields(model, { value: () => value }),
    })),
  })

  return { block, Message, OutMessage }
}

const GenericChoice = makeGenericChoice(Schema.Literals(['One', 'Two']))
const GenericParentModel = Schema.Struct({ choice: GenericChoice.block.Model })
type GenericParentModel = typeof GenericParentModel.Type
const GenericParentMessage = defineMessageUnion({
  GotChoiceMessage: { message: GenericChoice.Message },
})
const GenericParentDefinition = define('ParentOwnedGenericParent', {
  Model: GenericParentModel,
  Message: GenericParentMessage,
})
const genericChoice = GenericParentDefinition.bindChild(GenericChoice.block, {
  field: 'choice',
  parentMessage: GenericParentMessage.GotChoiceMessage,
  outMessage: {
    fold: outMessage =>
      GenericChoice.OutMessage.match<
        Update.Step<GenericParentModel, typeof GenericParentMessage.Type>
      >(outMessage, {
        SelectedChoice:
          ({ value }) =>
          model => {
            expectTypeOf(value).toEqualTypeOf<'One' | 'Two'>()
            return { model }
          },
      }),
  },
})

const ApplicationDefinition = defineApplication({
  Model: ParentModel,
  Message: ParentMessage,
})
const applicationChild = ApplicationDefinition.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: { fold: foldChildOutMessage },
})
const ApplicationComposition = ApplicationDefinition.toComposition({
  children: [applicationChild],
})

const SnapshotMount = ParentDefinition.mount('SnapshotMount', {
  messages: [ParentMessage.GotChildMessage],
})
const AlternateSnapshotMount = ParentDefinition.mount(
  'AlternateSnapshotMount',
  {
    messages: [ParentMessage.GotChildMessage],
  },
)

if (false) {
  // @ts-expect-error Every Block completes through a Composition.
  ParentDefinition.toBlock
  // @ts-expect-error The breaking staging API does not retain register aliases.
  ParentDefinition.register
  // @ts-expect-error Every Application completes through a Composition.
  ApplicationDefinition.makeElement
  // @ts-expect-error An Application Composition does not expose Block completion.
  ApplicationComposition.toBlock
  // @ts-expect-error A completed child has no child-owned Binding factory.
  ChildBlock.connection
  // @ts-expect-error Keyed Bindings are also created by the parent.
  ChildBlock.keyedConnection

  // @ts-expect-error Direct shorthand accepts only exact required child fields.
  ParentDefinition.bindChild(ChildBlock, {
    field: 'maybeChild',
    parentMessage: ParentMessage.GotChildMessage,
    outMessage: { fold: foldChildOutMessage },
  })

  // @ts-expect-error A child Message mapper must return the parent Message.
  ParentDefinition.bindChild(ChildBlock, {
    field: 'child',
    toParentMessage: () => ({ _tag: 'ForeignMessage' }),
    outMessage: { fold: foldChildOutMessage },
  })

  ParentDefinition.toComposition().toBlock({
    init: ParentBlock.init,
    update,
    // @ts-expect-error Child operations require registration in the Composition.
    EffectsLayer: Layer.empty,
  })
}

it('creates direct, optional, and keyed Bindings from the parent', () => {
  expect(directChild.placement).toBe('child')
  expect(optionalChild.placement).toBe('optionalChild')
  expect(taggedChild.placement).toBe('taggedChild')
  expect(keyedChild.placement).toBe('entries')
  expectTypeOf(directChild.fold).parameter(0).toEqualTypeOf<ParentModel>()
  expectTypeOf(directChild.fold).parameter(1).toEqualTypeOf<ChildMessage>()
  expectTypeOf<
    CommandMessageOfReturn<ReturnType<typeof exactMessageChild.fold>>
  >().toEqualTypeOf<ReturnType<typeof ParentMessage.GotChildMessage>>()
  expectTypeOf<
    CommandMessageOfReturn<ReturnType<typeof exactCustomMessageChild.fold>>
  >().toEqualTypeOf<ReturnType<typeof ParentMessage.GotChildMessage>>()
  expectTypeOf<
    ReturnType<ReturnType<typeof forwardingChild.selectValue>>['outMessage']
  >().toEqualTypeOf<ParentOutMessage | undefined>()
  expectTypeOf(keyedChild.fold).parameter(1).toEqualTypeOf<number>()
  expectTypeOf(keyedChild.fold).parameter(2).toEqualTypeOf<ChildMessage>()
  expectTypeOf(genericChoice.fold)
    .parameter(0)
    .toEqualTypeOf<GenericParentModel>()
  expect(ApplicationComposition.children).toEqual([applicationChild])
})

it('freezes parent-owned Bindings after their private metadata is registered', () => {
  expect(Object.isFrozen(directChild)).toBe(true)
  expect(Object.isFrozen(keyedChild)).toBe(true)
  expect(Reflect.set(directChild, 'placement', 'mutated')).toBe(false)
  expect(directChild.placement).toBe('child')
})

it('snapshots mutable child and Mount arrays at the Composition boundary', () => {
  const duplicateChild = ParentDefinition.bindChild(ChildBlock, {
    field: 'child',
    parentMessage: ParentMessage.GotChildMessage,
    outMessage: { fold: foldChildOutMessage },
  })
  const suppliedChildren: Array<typeof directChild> = [directChild]
  const suppliedMounts: Array<
    typeof SnapshotMount | typeof AlternateSnapshotMount
  > = [SnapshotMount]
  const composition = ParentDefinition.toComposition({
    children: suppliedChildren,
    mounts: suppliedMounts,
  })

  suppliedChildren.push(duplicateChild)
  suppliedMounts.push(AlternateSnapshotMount)
  expect(composition.children).toEqual([directChild])
  expect(composition.mounts).toEqual([SnapshotMount])

  suppliedChildren.splice(0, 1, duplicateChild)
  suppliedMounts.splice(0, 1, AlternateSnapshotMount)
  expect(composition.children).toEqual([directChild])
  expect(composition.mounts).toEqual([SnapshotMount])

  suppliedChildren.pop()
  suppliedMounts.pop()
  expect(composition.children).toEqual([directChild])
  expect(composition.mounts).toEqual([SnapshotMount])
  expect(Object.isFrozen(composition.children)).toBe(true)
  expect(Object.isFrozen(composition.mounts)).toBe(true)
})

it('keeps Application Composition snapshots independent from caller arrays', () => {
  const suppliedChildren: Array<typeof applicationChild> = [applicationChild]
  const composition = ApplicationDefinition.toComposition({
    children: suppliedChildren,
  })

  suppliedChildren.pop()

  expect(composition.children).toEqual([applicationChild])
  expect(Object.isFrozen(composition.children)).toBe(true)
})

it('rejects an authentic Binding created by a different parent identity', () => {
  const ForeignParentDefinition = define('ParentOwnedBindingForeignParent', {
    Model: ParentModel,
    Message: ParentMessage,
    OutMessage: ParentOutMessage,
  })

  expect(() =>
    ForeignParentDefinition.toComposition({ children: [directChild] }),
  ).toThrow(/different parent Definition/)
})

it('accepts Definition and Composition helpers that share one parent identity', () => {
  const compositionHelper = ParentDefinition.toComposition()
  const compositionOwnedChild = compositionHelper.bindChild(ChildBlock, {
    field: 'child',
    placement: 'compositionOwnedChild',
    parentMessage: ParentMessage.GotChildMessage,
    outMessage: { fold: foldChildOutMessage },
  })

  expect(
    ParentDefinition.toComposition({ children: [compositionOwnedChild] })
      .children,
  ).toEqual([compositionOwnedChild])
})

it('accepts shared named contracts and rejects incompatible contracts from that owner', () => {
  const SharedParent = define('ParentOwnedBindingSharedParent')
  const FirstDefinition = SharedParent.define({
    Model: ParentModel,
    Message: ParentMessage,
    OutMessage: ParentOutMessage,
  })
  const RefinedDefinition = SharedParent.define({
    Model: ParentModel,
    Message: ParentMessage,
    OutMessage: ParentOutMessage,
  })
  const IncompatibleParentModel = Schema.Struct({
    child: ChildModel,
    unrelated: Schema.String,
  })
  const IncompatibleDefinition = SharedParent.define({
    Model: IncompatibleParentModel,
    Message: ParentMessage,
    OutMessage: ParentOutMessage,
  })
  const sharedChild = FirstDefinition.bindChild(PlainChildBlock, {
    field: 'child',
    parentMessage: ParentMessage.GotChildMessage,
  })

  expect(
    RefinedDefinition.toComposition({ children: [sharedChild] }).children,
  ).toEqual([sharedChild])
  expect(() =>
    Reflect.apply(IncompatibleDefinition.toComposition, undefined, [
      { children: [sharedChild] },
    ]),
  ).toThrow(/different parent Definition contract/)
})

it('uses only own properties to distinguish Binding config forms', () => {
  const inheritedReadAllConfig = Object.assign(
    Object.create({ readAll: () => [] }),
    {
      placement: 'inheritedReadAll',
      read: (model: ParentModel) => Option.some(model.child),
      write: (model: ParentModel, child: ChildModel) =>
        modifyFields(model, { child: () => child }),
      parentMessage: ParentMessage.GotChildMessage,
    },
  )
  const inheritedMapperConfig = Object.assign(
    Object.create({
      toParentMessage: (_message: ChildMessage) =>
        ParentMessage.GotChildMessage({ message: _message }),
    }),
    {
      placement: 'inheritedMapper',
      read: (model: ParentModel) => Option.some(model.child),
      write: (model: ParentModel, child: ChildModel) =>
        modifyFields(model, { child: () => child }),
      parentMessage: ParentMessage.GotChildMessage,
    },
  )
  const inheritedReadAll = ParentDefinition.bindChild(
    PlainChildBlock,
    inheritedReadAllConfig,
  )
  const inheritedMapper = ParentDefinition.bindChild(
    PlainChildBlock,
    inheritedMapperConfig,
  )
  const model = ParentBlock.init().model
  const message = ChildMessage.UpdatedValue({ value: 'updated' })

  const inheritedReadAllResult = Reflect.apply(
    Reflect.get(inheritedReadAll, 'fold'),
    inheritedReadAll,
    [model, message],
  )
  const inheritedMapperResult = Reflect.apply(
    Reflect.get(inheritedMapper, 'fold'),
    inheritedMapper,
    [model, message],
  )

  expect(inheritedReadAllResult.model.child.value).toBe('updated')
  expect(inheritedMapperResult.model.child.value).toBe('updated')
})

it('binds an exposed operation named __proto__ as an own property', () => {
  const prototypeOperation = ParentDefinition.bindChild(
    PrototypeOperationChildBlock,
    {
      field: 'child',
      placement: 'prototypeOperation',
      parentMessage: ParentMessage.GotChildMessage,
    },
  )
  const boundOperation = Reflect.get(prototypeOperation, '__proto__')
  const operationStep = Reflect.apply(boundOperation, prototypeOperation, [
    'safe',
  ])
  const result = Reflect.apply(operationStep, undefined, [
    ParentBlock.init().model,
  ])

  expect(Object.hasOwn(prototypeOperation, '__proto__')).toBe(true)
  expect(result.model.child.value).toBe('safe')
})
