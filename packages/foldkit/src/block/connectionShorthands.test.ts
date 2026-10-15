import { Array, Context, Effect, Layer, Option, Schema, Stream } from 'effect'
import { expect, expectTypeOf, it } from 'vitest'

import type * as Command from '../command/index.js'
import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import type * as Update from '../update/index.js'
import { aggregateChildren, inspectBinding } from './binding.js'
import { define } from './define.js'
import { normalizeConnectionConfig } from './directConnection.js'
import { ViewScopeTypeId } from './identity.js'
import type { Qualify } from './scope.js'

class ValueSource extends Context.Service<
  ValueSource,
  Readonly<{ value: number }>
>()('ConnectionShorthands/ValueSource') {}

const Model = Schema.Struct({ count: Schema.Number })
const Message = defineMessageUnion({
  RequestedRead: {},
  CompletedRead: { count: Schema.Number },
  ObservedTick: {},
  CompletedObserve: {},
  AcquiredSession: {},
  ReleasedSession: {},
  FailedAcquireSession: {},
})
const OutMessage = defineMessageUnion({ ReadRequested: {} })
const Child = define('Child', { Model, Message, OutMessage })
const Read = Child.command('Read', {
  messages: [Message.CompletedRead],
  handler: function* () {
    const source = yield* ValueSource

    return () => Effect.succeed(Message.CompletedRead({ count: source.value }))
  },
})
const Observe = Child.mount('Observe', {
  messages: [Message.CompletedObserve],
  handler: function* () {
    return () => Effect.succeed(Message.CompletedObserve())
  },
})
const Session = Child.resource<string>()('Session')
const subscriptions = Child.subscriptions(entry => ({
  ticks: entry('Ticks', {
    messages: [Message.ObservedTick],
    handler: function* () {
      return () => Stream.succeed(Message.ObservedTick())
    },
  }),
}))
const managedResources = Child.managedResources(entry => ({
  session: entry('ManageSession', Schema.Option(Schema.Null), {
    resource: Session,
    modelToMaybeRequirements: () => Option.some(null),
    onAcquired: () => Message.AcquiredSession(),
    onReleased: Message.ReleasedSession,
    onAcquireError: () => Message.FailedAcquireSession(),
    handler: function* () {
      return {
        acquire: () => Effect.succeed('session'),
        release: () => Effect.void,
      }
    },
  }),
}))
const registered = Child.toComposition({ mounts: [Observe] })
const view = registered.view((model, h) =>
  h.div([h.OnMount(Observe())], [globalThis.String(model.count)]),
)
const block = registered.toBlock({
  init: () => ({ model: Model.make({ count: 0 }) }),
  update: Child.update((model, message) =>
    Message.match(message, {
      RequestedRead: () => ({
        model,
        commands: [Read()],
        outMessage: OutMessage.ReadRequested(),
      }),
      CompletedRead: ({ count }) => ({
        model: modifyFields(model, { count: () => count }),
      }),
      ObservedTick: () => ({ model }),
      CompletedObserve: () => ({ model }),
      AcquiredSession: () => ({ model }),
      ReleasedSession: () => ({ model }),
      FailedAcquireSession: () => ({ model }),
    }),
  ),
  view,
  subscriptions,
  managedResources,
  EffectsLayer: Layer.mergeAll(
    Read.layer,
    Observe.layer,
    subscriptions.ticks.layer,
    managedResources.session.layer,
  ),
  expose: { read: Child.step(model => ({ model, commands: [Read()] })) },
})
const Entry = Schema.Struct({ id: Schema.String, child: Model })
const ParentModel = Schema.Struct({
  primary: Model,
  secondary: Model,
  requests: Schema.Number,
  entries: Schema.Array(Entry),
})
type ParentModel = typeof ParentModel.Type
const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: Message },
  GotEntryMessage: { id: Schema.String, message: Message },
  GotForeignMessage: { message: Schema.String },
})
type ParentMessage = typeof ParentMessage.Type
const Parent = define('ConnectionShorthandsParent', {
  Model: ParentModel,
  Message: ParentMessage,
})
const foldChildOutMessage = OutMessage.match<
  Update.Step<ParentModel, ParentMessage>
>({
  ReadRequested: () => model => ({
    model: modifyFields(model, { requests: requests => requests + 1 }),
  }),
})
const primary = Parent.bindChild(block, {
  field: 'primary',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: { fold: foldChildOutMessage },
})
const primaryInspection = inspectBinding(primary)
const secondary = Parent.bindChild(block, {
  field: 'secondary',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: { fold: foldChildOutMessage },
})
const overridden = Parent.bindChild(block, {
  field: 'secondary',
  placement: 'alternate',
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: { fold: foldChildOutMessage },
})
const accessor = Parent.bindChild(block, {
  read: model => Option.some(model.primary),
  write: (model, nextPrimary) =>
    modifyFields(model, { primary: () => nextPrimary }),
  parentMessage: ParentMessage.GotChildMessage,
  outMessage: { fold: foldChildOutMessage },
})
const entryKey = (entry: typeof Entry.Type): string => entry.id
const keyed = Parent.bindChild(block, {
  placement: 'entries',
  readAll: (model: ParentModel) => model.entries,
  key: entryKey,
  read: (entry: typeof Entry.Type) => entry.child,
  writeAt: (model: ParentModel, id: string, nextChild: typeof Model.Type) =>
    modifyFields(model, {
      entries: Array.map(entry =>
        entry.id === id
          ? modifyFields(entry, { child: () => nextChild })
          : entry,
      ),
    }),
  toParentMessage: (id: string, message: typeof Message.Type) =>
    ParentMessage.GotEntryMessage({ id, message }),
  outMessage: {
    fold: (_key: string, outMessage: typeof OutMessage.Type) =>
      foldChildOutMessage(outMessage),
  },
})
const initial = ParentModel.make({
  primary: Model.make({ count: 1 }),
  secondary: Model.make({ count: 2 }),
  requests: 0,
  entries: [Entry.make({ id: 'first', child: Model.make({ count: 3 }) })],
})

if (false) {
  Parent.bindChild(block, {
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    field: 'primary',
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    parentMessage: ParentMessage.GotForeignMessage,
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    outMessage: { fold: foldChildOutMessage },
  })
  Parent.bindChild(block, {
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    field: 'primary',
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    parentMessage: ParentMessage.GotEntryMessage,
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    outMessage: { fold: foldChildOutMessage },
  })
  Parent.bindChild(block, {
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    field: 'primary',
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    toParentMessage: (message: typeof Message.Type) =>
      ParentMessage.GotChildMessage({ message }),
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    parentMessage: ParentMessage.GotChildMessage,
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    outMessage: { fold: foldChildOutMessage },
  })
  Parent.bindChild(block, {
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    read: (model: ParentModel) => Option.some(model.primary),
    write: (model: ParentModel, nextPrimary: typeof Model.Type) =>
      modifyFields(model, { primary: () => nextPrimary }),
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    toParentMessage: (message: typeof Message.Type) =>
      ParentMessage.GotChildMessage({ message }),
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    parentMessage: ParentMessage.GotChildMessage,
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    outMessage: { fold: foldChildOutMessage },
  })
  Parent.bindChild(block, {
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    field: 'primary',
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    parentMessage: ParentMessage.GotChildMessage,
  })
  Parent.bindChild(block, {
    readAll: (model: ParentModel) => model.entries,
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    key: (entry: typeof Entry.Type) => entry.id,
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    read: (entry: typeof Entry.Type) => entry.child,
    writeAt: (model: ParentModel) => model,
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    parentMessage: ParentMessage.GotEntryMessage,
    // @ts-expect-error This invalid Binding configuration has no matching overload.
    outMessage: { fold: () => foldChildOutMessage },
  })
}

it('keeps exact placement literals and child operation arguments', () => {
  expectTypeOf<Extract<keyof typeof primary, string>>().toEqualTypeOf<
    'placement' | 'init' | 'fold' | 'embedView' | 'read'
  >()
  expectTypeOf(primary.placement).toEqualTypeOf<'primary'>()
  expectTypeOf(secondary.placement).toEqualTypeOf<'secondary'>()
  expectTypeOf(overridden.placement).toEqualTypeOf<'alternate'>()
  expectTypeOf(accessor.placement).toEqualTypeOf<'Child'>()
  expectTypeOf(keyed.placement).toEqualTypeOf<'entries'>()
  expectTypeOf(
    primary.fold(initial, Message.RequestedRead()).model,
  ).toEqualTypeOf<ParentModel>()
  expectTypeOf<Parameters<typeof primary.read>>().toEqualTypeOf<[]>()
  expectTypeOf<Update.RequirementsOf<typeof primary.fold>>().toEqualTypeOf<
    Qualify<'primary', Command.HandlerOf<typeof Read>>
  >()
  expectTypeOf<
    Layer.Services<typeof primaryInspection.EffectsLayer>
  >().toEqualTypeOf<ValueSource>()
  expectTypeOf<
    Layer.Error<typeof primaryInspection.EffectsLayer>
  >().toEqualTypeOf<never>()
  expectTypeOf<(typeof primaryInspection.mounts)[number]>().toEqualTypeOf<
    typeof Observe
  >()
  expect(primary.placement).toBe('primary')
  expect(secondary.placement).toBe('secondary')
  expect(overridden.placement).toBe('alternate')
  expect(accessor.placement).toBe('Child')
  expect(Object.keys(primary)).toEqual([
    'placement',
    'init',
    'fold',
    'embedView',
    'read',
  ])
  expect(Object.keys(keyed)).toEqual([
    'placement',
    'init',
    'fold',
    'embedView',
    'read',
  ])
  expect(inspectBinding(keyed).subscriptions).toEqual({})
  expect(inspectBinding(keyed).managedResources).toEqual({})
  expect(Array.head(primaryInspection.mounts)).toEqual(Option.some(Observe))
})

it('lifts real Command execution through the constructor and preserves OutMessage handling', async () => {
  const result = primary.fold(initial, Message.RequestedRead())
  const command = Option.getOrThrow(Array.head(result.commands!))
  const operation = Option.getOrThrow(
    Array.head(primary.read()(initial).commands!),
  )
  const services = inspectBinding(primary).EffectsLayer.pipe(
    Layer.provide(Layer.succeed(ValueSource, { value: 42 })),
  )
  const completed = await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const context = yield* Layer.build(services)
        return yield* Effect.provideContext(command.effect, context)
      }),
    ),
  )

  expect(result.model.requests).toBe(1)
  expect(command.name).toBe('primary/Read')
  expect(operation.name).toBe('primary/Read')
  expect(completed).toEqual(
    ParentMessage.GotChildMessage({
      message: Message.CompletedRead({ count: 42 }),
    }),
  )
  const updated = ParentMessage.match(completed, {
    GotChildMessage: ({ message }) => primary.fold(result.model, message),
    GotEntryMessage: () => {
      throw new Error('Expected a static child Message')
    },
    GotForeignMessage: () => {
      throw new Error('Expected the declared child Message union')
    },
  })

  expect(updated.model.primary.count).toBe(42)
  expect(initial.primary.count).toBe(1)
})

it('uses one resolved occurrence placement for lifecycle registrations and mounted views', () => {
  const graph = aggregateChildren([primary, secondary])
  const primaryEmbed = primary.embedView({
    slotId: 'primary',
    model: initial.primary,
  })
  const secondaryEmbed = secondary.embedView({
    slotId: 'secondary',
    model: initial.secondary,
  })

  expect(inspectBinding(primary).subscriptions.ticks.name).toBe('primary/Ticks')
  expect(inspectBinding(secondary).subscriptions.ticks.name).toBe(
    'secondary/Ticks',
  )
  expect(inspectBinding(primary).managedResources.session.name).toBe(
    'primary/ManageSession',
  )
  expect(inspectBinding(secondary).managedResources.session.name).toBe(
    'secondary/ManageSession',
  )
  expect(inspectBinding(primary).managedResources.session.resource.key).toBe(
    `primary/${Session.key}`,
  )
  expect(
    inspectBinding(secondary).managedResources.session.resource._tag.key,
  ).not.toBe(inspectBinding(primary).managedResources.session.resource._tag.key)
  expect(Reflect.get(primaryEmbed, ViewScopeTypeId).placement).toBe('primary')
  expect(Reflect.get(secondaryEmbed, ViewScopeTypeId).placement).toBe(
    'secondary',
  )
  expect(graph.subscriptions['primary/ticks']).toBe(
    inspectBinding(primary).subscriptions.ticks,
  )
  expect(graph.subscriptions['secondary/ticks']).toBe(
    inspectBinding(secondary).subscriptions.ticks,
  )
  expect(() => aggregateChildren([primary, primary])).toThrow(
    /duplicate|Two child Blocks/,
  )
  expect(
    keyed.fold(initial, 'first', Message.CompletedRead({ count: 9 })).model
      .entries,
  ).toEqual([Entry.make({ id: 'first', child: Model.make({ count: 9 }) })])
})

it('rejects ambiguous mappings before building a Binding', () => {
  expect(() =>
    normalizeConnectionConfig({
      Model: ParentModel,
      field: 'primary',
      parentMessage: ParentMessage.GotChildMessage,
      toParentMessage: (message: typeof Message.Type) =>
        ParentMessage.GotChildMessage({ message }),
    }),
  ).toThrow('exactly one parent Message mapping')
})
