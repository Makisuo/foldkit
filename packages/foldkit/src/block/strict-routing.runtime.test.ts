import { Array, Option, Schema } from 'effect'
import { expect, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import { define } from './define.js'
import { makeCompositionUpdate } from './delivery.js'

const ChildModel = Schema.Struct({ count: Schema.Number })
const ChildMessage = defineMessageUnion({
  ChangedCount: { amount: Schema.Number },
})

const Child = define('StrictRoutingRuntimeChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const ChildComposition = Child.makeComposition()
const ChildBlock = ChildComposition.makeBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: ChildComposition.makeUpdate((model, { amount }) => ({
    model: modifyFields(model, { count: count => count + amount }),
  })),
})

const ContextChild = define('StrictRoutingRuntimeContextChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const ContextChildComposition = ContextChild.makeComposition()
const ContextChildBlock = ContextChildComposition.makeBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: ContextChildComposition.makeUpdate(
    (model, { amount }, context: Readonly<{ multiplier: number }>) => ({
      model: modifyFields(model, {
        count: count => count + amount * context.multiplier,
      }),
    }),
  ),
})

const Entry = Schema.Struct({ id: Schema.String, child: ChildModel })
const ParentModel = Schema.Struct({
  child: ChildModel,
  contextualChild: ChildModel,
  entries: Schema.Array(Entry),
  multiplier: Schema.Number,
  resets: Schema.Number,
})
const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
  GotContextMessage: { message: ChildMessage },
  GotEntryMessage: { id: Schema.String, message: ChildMessage },
  ClickedReset: {},
})
const Parent = define('StrictRoutingRuntimeParent', {
  Model: ParentModel,
  Message: ParentMessage,
})

const ChildBinding = Parent.bindChild(ChildBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})
const ContextBinding = Parent.bindChild(ContextChildBlock, {
  field: 'contextualChild',
  toParentMessage: message => ParentMessage.GotContextMessage({ message }),
  fromParentMessage: {
    parentMessage: ParentMessage.GotContextMessage,
    args: (model, { message }) =>
      Option.some([message, { multiplier: model.multiplier }]),
  },
})
const EntryBinding = Parent.bindChild(ChildBlock, {
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: (model, id, nextChild) =>
    modifyFields(model, {
      entries: Array.map(entry =>
        entry.id === id
          ? modifyFields(entry, { child: () => nextChild })
          : entry,
      ),
    }),
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
  fromParentMessage: {
    parentMessage: ParentMessage.GotEntryMessage,
    args: (_model, { id, message }) =>
      id === 'active' ? Option.some([id, message]) : Option.none(),
  },
})

const ParentComposition = Parent.makeComposition({
  childBindings: [ChildBinding, ContextBinding, EntryBinding],
})
const parentUpdate = ParentComposition.makeUpdate(model => ({
  model: modifyFields(model, { resets: resets => resets + 1 }),
}))
const parentModel = ParentModel.make({
  child: ChildModel.make({ count: 0 }),
  contextualChild: ChildModel.make({ count: 0 }),
  entries: [Entry.make({ id: 'active', child: ChildModel.make({ count: 0 }) })],
  multiplier: 3,
  resets: 0,
})

const rawFullMessageUpdate = (
  model: typeof ParentModel.Type,
  message: typeof ParentMessage.Type,
) => ({
  model: modifyFields(model, {
    resets: resets =>
      message._tag === 'GotChildMessage' ? resets + 100 : resets + 1,
  }),
})
const RawCompletionBlock = ParentComposition.makeBlock({
  init: () => ({ model: parentModel }),
  update: rawFullMessageUpdate,
})
const GeneratedCompletionBlock = ParentComposition.makeBlock({
  init: () => ({ model: parentModel }),
  update: parentUpdate,
})

it('routes canonical, contextual, and keyed Messages before authored facts', () => {
  const canonical = parentUpdate(
    parentModel,
    ParentMessage.GotChildMessage({
      message: ChildMessage.ChangedCount({ amount: 2 }),
    }),
  )
  const contextual = parentUpdate(
    parentModel,
    ParentMessage.GotContextMessage({
      message: ChildMessage.ChangedCount({ amount: 2 }),
    }),
  )
  const keyed = parentUpdate(
    parentModel,
    ParentMessage.GotEntryMessage({
      id: 'active',
      message: ChildMessage.ChangedCount({ amount: 2 }),
    }),
  )
  const stale = parentUpdate(
    parentModel,
    ParentMessage.GotEntryMessage({
      id: 'stale',
      message: ChildMessage.ChangedCount({ amount: 2 }),
    }),
  )
  const local = parentUpdate(parentModel, ParentMessage.ClickedReset())

  expect(canonical.model.child.count).toBe(2)
  expect(canonical.model.resets).toBe(0)
  expect(contextual.model.contextualChild.count).toBe(6)
  expect(keyed.model.entries).toEqual([{ id: 'active', child: { count: 2 } }])
  expect(stale.model).toBe(parentModel)
  expect(local.model.resets).toBe(1)
})

it('installs routing around a raw full-Message completion update', () => {
  const routed = RawCompletionBlock.update(
    parentModel,
    ParentMessage.GotChildMessage({
      message: ChildMessage.ChangedCount({ amount: 1 }),
    }),
  )
  const local = RawCompletionBlock.update(
    parentModel,
    ParentMessage.ClickedReset(),
  )

  expect(routed.model.child.count).toBe(1)
  expect(routed.model.resets).toBe(0)
  expect(local.model.resets).toBe(1)
  expect(RawCompletionBlock.update).not.toBe(rawFullMessageUpdate)
})

it('does not wrap an update authored by the same Composition twice', () => {
  expect(GeneratedCompletionBlock.update).toBe(parentUpdate)
})

it('rejects missing and conflicting Got wrapper owners for erased callers', () => {
  expect(() => Reflect.apply(Parent.makeComposition, Parent, [])).toThrow(
    'Got* child wrapper without an owning Binding',
  )

  const duplicateBinding = Parent.bindChild(ChildBlock, {
    field: 'child',
    placement: 'duplicate-child',
    parentMessage: ParentMessage.GotChildMessage,
    init: false,
  })

  expect(() =>
    Reflect.apply(Parent.makeComposition, Parent, [
      {
        childBindings: [
          ChildBinding,
          ContextBinding,
          EntryBinding,
          duplicateBinding,
        ],
      },
    ]),
  ).toThrow('both claim parent Message "GotChildMessage"')
})

it('blocks an unclaimed Got Message hidden behind an opaque Schema', () => {
  const opaqueUpdate = makeCompositionUpdate(
    Schema.Unknown,
    [],
    false,
  )((model: Readonly<{ authored: number }>) => ({
    model: { authored: model.authored + 1 },
  }))

  expect(() =>
    opaqueUpdate(
      { authored: 0 },
      {
        _tag: 'GotDynamicMessage',
        message: ChildMessage.ChangedCount({ amount: 1 }),
      },
    ),
  ).toThrow('without an owning Binding')
})

it('reserves every Got prefix independent of its payload field name', () => {
  const EventMessage = defineMessageUnion({
    GotEvent: { event: Schema.String },
    ClickedReset: {},
  })

  expect(() => makeCompositionUpdate(EventMessage, [], true)).toThrow(
    'Parent Message "GotEvent" is a Got* child wrapper without an owning Binding',
  )
})
