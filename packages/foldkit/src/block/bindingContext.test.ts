import { Array, Layer, Option, Schema, Tuple } from 'effect'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import * as Update from '../update/index.js'
import type { BindingRequirement } from './binding.js'
import { define } from './define.js'
import type { BindingInitRecipe } from './initRecipe.js'

const CounterModel = Schema.Struct({ count: Schema.Number })
const CounterMessage = defineMessageUnion({ ClickedReset: {} })
const CounterOutMessage = defineMessageUnion({ Reset: {} })
const ResetCounter = define('ResetCounter', {
  Model: CounterModel,
  Message: CounterMessage,
  OutMessage: CounterOutMessage,
})
const reset = ResetCounter.step(model => ({
  model: modifyFields(model, { count: () => 0 }),
  outMessage: CounterOutMessage.Reset(),
}))
const ResetCounterComposition = ResetCounter.makeComposition()
const block = ResetCounterComposition.makeBlock({
  init: (count: number) => ({ model: CounterModel.make({ count }) }),
  update: ResetCounterComposition.makeUpdate((model, _message) => reset(model)),
  operations: { reset: () => Tuple.make(CounterMessage.ClickedReset()) },
  EffectsLayer: Layer.empty,
})
const Model = Schema.Struct({
  counter: CounterModel,
  entries: Schema.Array(
    Schema.Struct({ id: Schema.Number, counter: CounterModel }),
  ),
  previousCount: Schema.Number,
})
type Model = typeof Model.Type
const Message = defineMessageUnion({
  GotCounterMessage: { message: CounterMessage },
  GotEntryMessage: { id: Schema.Number, message: CounterMessage },
  RequestedResetCounter: {},
  RequestedResetEntry: { id: Schema.Number },
})
type Message = typeof Message.Type
const Parent = define('BindingContextParent', {
  Model,
  Message,
})

const foldCounterOutMessage = (
  outMessage: typeof CounterOutMessage.Type,
  {
    modelBeforeUpdate,
  }: Update.FoldContext<typeof CounterMessage.Type, Message, Model>,
) =>
  CounterOutMessage.match<Update.Step<Model, Message>>(outMessage, {
    Reset: () => model => ({
      model: modifyFields(model, {
        previousCount: () => modelBeforeUpdate.counter.count,
      }),
    }),
  })
const BoundCounterBinding = Parent.bindChild(block, {
  read: model => Option.some(model.counter),
  write: (model: Model, nextCounter: typeof CounterModel.Type) =>
    modifyFields(model, { counter: () => nextCounter }),
  parentMessage: Message.GotCounterMessage,
  outMessage: { fold: foldCounterOutMessage },
})
const keyedPolicy = {
  fold: (
    id: number,
    outMessage: typeof CounterOutMessage.Type,
    {
      modelBeforeUpdate,
    }: Update.FoldContext<typeof CounterMessage.Type, Message, Model>,
  ) =>
    CounterOutMessage.match<Update.Step<Model, Message>>(outMessage, {
      Reset: () => model => ({
        model: modifyFields(model, {
          previousCount: () =>
            Option.match(
              Array.findFirst(
                modelBeforeUpdate.entries,
                entry => entry.id === id,
              ),
              {
                onNone: () => model.previousCount,
                onSome: entry => entry.counter.count,
              },
            ),
        }),
      }),
    }),
}
const entriesPlacement: 'entries' = 'entries'
const keyedBaseConfig = {
  placement: entriesPlacement,
  readAll: (model: Model) => model.entries,
  key: (entry: Model['entries'][number]) => entry.id,
  read: (entry: Model['entries'][number]) => entry.counter,
  writeAt: (
    model: Model,
    id: number,
    nextCounter: typeof CounterModel.Type,
  ): Model =>
    modifyFields(model, {
      entries: Array.map(entry =>
        entry.id === id ? { ...entry, counter: nextCounter } : entry,
      ),
    }),
  toParentMessage: (id: number, message: typeof CounterMessage.Type) =>
    Message.GotEntryMessage({ id, message }),
  fromParentMessage: {
    parentMessage: Message.GotEntryMessage,
    args: (
      _model: Model,
      { id, message }: typeof Message.GotEntryMessage.Type,
    ): Option.Option<readonly [number, typeof CounterMessage.Type]> =>
      Option.some([id, message]),
  },
}
const EntriesBinding = Parent.bindChild(block, {
  ...keyedBaseConfig,
  outMessage: keyedPolicy,
})
const initialModel = Model.make({
  counter: { count: 3 },
  entries: [{ id: 1, counter: { count: 5 } }],
  previousCount: 0,
})
const toCounterParentModel = (counter: typeof CounterModel.Type): Model =>
  Model.make({ ...initialModel, counter })
const toEntryParentModel = (
  id: number,
  counter: typeof CounterModel.Type,
): Model => Model.make({ ...initialModel, entries: [{ id, counter }] })

const SequencedCounterModel = Schema.Struct({ count: Schema.Number })
const SequencedCounterMessage = defineMessageUnion({
  RequestedAdd: { amount: Schema.Number },
  RequestedRecord: {},
  RequestedMultiply: { factor: Schema.Number },
  CompletedRecordCount: {},
})
const SequencedCounter = define('SequencedCounter', {
  Model: SequencedCounterModel,
  Message: SequencedCounterMessage,
})
const RecordCount = SequencedCounter.command('RecordCount', {
  args: { count: Schema.Number },
  messages: [SequencedCounterMessage.CompletedRecordCount],
})
const add = SequencedCounter.step((model, amount: number) => ({
  model: modifyFields(model, { count: count => count + amount }),
}))
const record = SequencedCounter.step(model => ({
  model,
  commands: [RecordCount({ count: model.count })],
}))
const multiply = SequencedCounter.step((model, factor: number) => ({
  model: modifyFields(model, { count: count => count * factor }),
}))
const SequencedCounterComposition = SequencedCounter.makeComposition()
const sequencedCounterBlock = SequencedCounterComposition.makeBlock({
  init: (count: number) => ({ model: { count } }),
  update: SequencedCounterComposition.makeUpdate((model, message) =>
    SequencedCounterMessage.match(message, {
      RequestedAdd: ({ amount }) => add(model, amount),
      RequestedRecord: () => record(model),
      RequestedMultiply: ({ factor }) => multiply(model, factor),
      CompletedRecordCount: () => ({ model }),
    }),
  ),
  operations: {
    add: (amount: number) =>
      Tuple.make(SequencedCounterMessage.RequestedAdd({ amount })),
    record: () => Tuple.make(SequencedCounterMessage.RequestedRecord()),
    multiply: (factor: number) =>
      Tuple.make(SequencedCounterMessage.RequestedMultiply({ factor })),
  },
  EffectsLayer: Layer.empty,
  hostHandlers: [RecordCount],
})
const SequencedParentModel = Schema.Struct({ child: SequencedCounterModel })
type SequencedParentModel = typeof SequencedParentModel.Type
const SequencedParentMessage = defineMessageUnion({
  GotSequencedCounterMessage: { message: SequencedCounterMessage },
  RequestedSequence: {},
})
const SequencedParent = define('SequencedCounterParent', {
  Model: SequencedParentModel,
  Message: SequencedParentMessage,
})
const SequencedCounterBinding = SequencedParent.bindChild(
  sequencedCounterBlock,
  {
    read: model => Option.some(model.child),
    write: (model, nextChild) =>
      modifyFields(model, { child: () => nextChild }),
    parentMessage: SequencedParentMessage.GotSequencedCounterMessage,
  },
)

type CommandMessageOf<Output> =
  Output extends Update.ResultRecipe<any, infer Message, any, any, any>
    ? Message
    : Output extends Readonly<{
          commands?: infer Commands
        }>
      ? NonNullable<Commands> extends Update.Commands<
          infer CommandMessage,
          infer _Requirements
        >
        ? CommandMessage
        : never
      : never

if (false) {
  const boundCounterInit = BoundCounterBinding.init({
    args: [1],
    toParentModel: toCounterParentModel,
  })
  // @ts-expect-error Passive child initialization does not expose a Model.
  boundCounterInit.model
  expectTypeOf<
    typeof boundCounterInit extends BindingInitRecipe<
      Model,
      Message,
      never,
      infer Evidence
    >
      ? Evidence
      : never
  >().toEqualTypeOf<BindingRequirement<'ResetCounter', typeof block>>()
  expectTypeOf<
    Update.RequirementsOf<() => typeof boundCounterInit>
  >().toEqualTypeOf<never>()
  const forwardBoundInit = (count: number): Update.Return<Model, Message> => {
    const counterInit = BoundCounterBinding.init({
      args: [count],
      toParentModel: toCounterParentModel,
    })
    // @ts-expect-error An explicit Return cannot erase passive initialization.
    return counterInit
  }
  void forwardBoundInit
  expectTypeOf<
    CommandMessageOf<ReturnType<typeof BoundCounterBinding.fold>>
  >().toEqualTypeOf<Message>()
  expectTypeOf<
    Update.GraphModelOf<typeof EntriesBinding.fold>
  >().toEqualTypeOf<Model>()
  expectTypeOf<
    Parameters<typeof EntriesBinding.fold>[1]
  >().toEqualTypeOf<number>()
  expectTypeOf<Parameters<typeof EntriesBinding.fold>[2]>().toEqualTypeOf<
    typeof CounterMessage.Type
  >()
  expectTypeOf(EntriesBinding.reset).parameters.toEqualTypeOf<[key: number]>()

  EntriesBinding.init({
    key: 1,
    args: [2],
    toParentModel: counter => toEntryParentModel(1, counter),
  })
  // @ts-expect-error A raw Model cannot execute an unregistered connected fold.
  EntriesBinding.fold(initialModel, 1, CounterMessage.ClickedReset())
  EntriesBinding.reset(1)

  // @ts-expect-error A keyed init requires its stable occurrence key.
  EntriesBinding.init({
    args: [2],
    toParentModel: counter => toEntryParentModel(1, counter),
  })
  EntriesBinding.init({
    key: 1,
    // @ts-expect-error A keyed init requires the complete child init argument tuple.
    args: [],
    toParentModel: counter => toEntryParentModel(1, counter),
  })
  // @ts-expect-error A keyed fold requires the key before the child Message.
  EntriesBinding.fold(initialModel, CounterMessage.ClickedReset())
  // @ts-expect-error A keyed exposed operation requires its key.
  EntriesBinding.reset()

  // @ts-expect-error A keyed child with OutMessages requires an explicit policy.
  Parent.bindChild(block, keyedBaseConfig)

  // @ts-expect-error This invalid Binding configuration has no matching overload.
  Parent.bindChild(block, {
    ...keyedBaseConfig,
    outMessage: {
      fold:
        (
          _id: string,
          _outMessage: typeof CounterOutMessage.Type,
          _context: Update.FoldContext<
            typeof CounterMessage.Type,
            typeof CounterMessage.Type,
            Model
          >,
        ) =>
        (model: Model) => ({ model }),
    },
  })

  // @ts-expect-error This invalid Binding configuration has no matching overload.
  Parent.bindChild(block, {
    ...keyedBaseConfig,
    outMessage: { forward: () => undefined },
  })

  // @ts-expect-error This invalid Binding configuration has no matching overload.
  Parent.bindChild(block, {
    ...keyedBaseConfig,
    outMessage: { forward: (): unknown => undefined },
  })

  // @ts-expect-error This invalid Binding configuration has no matching overload.
  Parent.bindChild(block, {
    ...keyedBaseConfig,
    // oxlint-disable-next-line effecttsgo/any-unknown-in-error-context
    outMessage: { forward: (): any => undefined },
  })
}

const StaticComposition = Parent.makeComposition({
  childBindings: [BoundCounterBinding, EntriesBinding],
})
const staticParent = StaticComposition.makeBlock({
  init: () => ({ model: initialModel }),
  update: StaticComposition.makeUpdate((model, message) =>
    Message.match(message, {
      RequestedResetCounter: () => BoundCounterBinding.reset()(model),
      RequestedResetEntry: () => ({ model }),
    }),
  ),
  operations: { reset: () => Tuple.make(Message.RequestedResetCounter()) },
})
const KeyedComposition = Parent.makeComposition({
  childBindings: [BoundCounterBinding, EntriesBinding],
})
const keyedParent = KeyedComposition.makeBlock({
  init: () => ({ model: initialModel }),
  update: KeyedComposition.makeUpdate((model, message) =>
    Message.match(message, {
      RequestedResetCounter: () => ({ model }),
      RequestedResetEntry: ({ id }) => EntriesBinding.reset(id)(model),
    }),
  ),
  operations: {
    reset: (id: number) => Tuple.make(Message.RequestedResetEntry({ id })),
  },
})

describe('bound OutMessage context', () => {
  it('preserves the previous parent Model for static folds and exposed operations', () => {
    const results = [
      staticParent.update(
        initialModel,
        Message.GotCounterMessage({ message: CounterMessage.ClickedReset() }),
      ),
      staticParent.operations.reset(initialModel),
    ]
    for (const result of results) {
      expect(result.model.counter.count).toBe(0)
      expect(result.model.previousCount).toBe(3)
    }
  })

  it('preserves the previous parent Model for keyed folds and exposed operations', () => {
    const results = [
      keyedParent.update(
        initialModel,
        Message.GotEntryMessage({
          id: 1,
          message: CounterMessage.ClickedReset(),
        }),
      ),
      keyedParent.operations.reset(initialModel, 1),
    ]
    for (const result of results) {
      expect(result.model.entries).toEqual([{ id: 1, counter: { count: 0 } }])
      expect(result.model.previousCount).toBe(5)
    }
    expect(EntriesBinding).not.toHaveProperty('step')
    expectTypeOf(EntriesBinding.reset).parameters.toEqualTypeOf<[key: number]>()
    expectTypeOf<
      'step' extends keyof typeof EntriesBinding ? true : false
    >().toEqualTypeOf<false>()
  })
})

describe('bound Step sequencing', () => {
  it('threads each projected Step Model forward and retains Commands in order', () => {
    const SequencedComposition = SequencedParent.makeComposition({
      childBindings: [SequencedCounterBinding],
    })
    const update = SequencedComposition.makeUpdate(model =>
      Update.combine(model, [
        SequencedCounterBinding.add(2),
        SequencedCounterBinding.record(),
        SequencedCounterBinding.multiply(3),
        SequencedCounterBinding.record(),
      ]),
    )
    const result = update(
      SequencedParentModel.make({ child: { count: 3 } }),
      SequencedParentMessage.RequestedSequence(),
    )

    expect(result.model.child.count).toBe(15)
    expect(result.commands?.map(command => command.name)).toEqual([
      'SequencedCounter/RecordCount',
      'SequencedCounter/RecordCount',
    ])
    expect(result.commands?.map(command => command.args)).toEqual([
      { count: 5 },
      { count: 15 },
    ])
  })
})
