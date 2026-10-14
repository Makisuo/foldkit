import { Array, Layer, Option, Schema } from 'effect'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import * as Update from '../update/index.js'
import type { BindingRequirement } from './binding.js'
import { define } from './define.js'

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
const block = ResetCounter.toComposition().toBlock({
  init: (count: number) => ({ model: CounterModel.make({ count }) }),
  update: ResetCounter.update((model, _message) => reset(model)),
  expose: { reset },
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
const boundCounter = Parent.bindChild(block, {
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
const keyedBaseConfig = {
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
  toParentMessage: (_id: number, message: typeof CounterMessage.Type) =>
    Message.GotCounterMessage({ message }),
}
const entries = Parent.bindChild(block, {
  ...keyedBaseConfig,
  outMessage: keyedPolicy,
})
const initialModel = Model.make({
  counter: { count: 3 },
  entries: [{ id: 1, counter: { count: 5 } }],
  previousCount: 0,
})

const SequencedCounterModel = Schema.Struct({ count: Schema.Number })
const SequencedCounterMessage = defineMessageUnion({
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
const sequencedCounterBlock = SequencedCounter.toComposition().toBlock({
  init: (count: number) => ({ model: { count } }),
  update: SequencedCounter.update(model => ({ model })),
  expose: { add, record, multiply },
  EffectsLayer: Layer.empty,
  hostHandlers: [RecordCount],
})
const SequencedParentModel = Schema.Struct({ child: SequencedCounterModel })
type SequencedParentModel = typeof SequencedParentModel.Type
const SequencedParentMessage = defineMessageUnion({
  GotSequencedCounterMessage: { message: SequencedCounterMessage },
})
const SequencedParent = define('SequencedCounterParent', {
  Model: SequencedParentModel,
  Message: SequencedParentMessage,
})
const sequencedCounterBinding = SequencedParent.bindChild(
  sequencedCounterBlock,
  {
    read: model => Option.some(model.child),
    write: (model, nextChild) =>
      modifyFields(model, { child: () => nextChild }),
    parentMessage: SequencedParentMessage.GotSequencedCounterMessage,
  },
)

type CommandMessageOf<Output> =
  Output extends Readonly<{
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
  expectTypeOf<ReturnType<typeof boundCounter.init>>().toEqualTypeOf<
    Update.WithRegistrationEvidence<
      Update.Return<typeof CounterModel.Type, Message, never>,
      BindingRequirement<'ResetCounter', typeof block>
    >
  >()
  expectTypeOf<
    Update.RegistrationEvidenceOf<ReturnType<typeof boundCounter.init>>
  >().toEqualTypeOf<BindingRequirement<'ResetCounter', typeof block>>()
  expectTypeOf<
    Update.RequirementsOf<typeof boundCounter.init>
  >().toEqualTypeOf<never>()
  const forwardBoundInit = (
    count: number,
  ): Update.Return<typeof CounterModel.Type, Message> => {
    const counterInit = boundCounter.init(count)
    return {
      model: counterInit.model,
      // @ts-expect-error An explicit Return cannot erase child registration evidence.
      commands: counterInit.commands,
    }
  }
  void forwardBoundInit
  expectTypeOf<
    CommandMessageOf<ReturnType<typeof boundCounter.fold>>
  >().toEqualTypeOf<Message>()
  expectTypeOf(entries.init).parameters.toEqualTypeOf<
    [key: number, count: number]
  >()
  expectTypeOf(entries.fold).parameters.toEqualTypeOf<
    [model: Model, key: number, message: typeof CounterMessage.Type]
  >()
  expectTypeOf(entries.reset).parameters.toEqualTypeOf<[key: number]>()

  entries.init(1, 2)
  entries.fold(initialModel, 1, CounterMessage.ClickedReset())
  entries.reset(1)

  // @ts-expect-error A keyed init requires both the key and child init input.
  entries.init(1)
  // @ts-expect-error A keyed fold requires the key before the child Message.
  entries.fold(initialModel, CounterMessage.ClickedReset())
  // @ts-expect-error A keyed exposed operation requires its key.
  entries.reset()

  // @ts-expect-error A keyed child with OutMessages requires an explicit policy.
  Parent.bindChild(block, keyedBaseConfig)

  // @ts-expect-error The policy key and parent Message must match the binding.
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

  // @ts-expect-error Forwarding must return a concrete parent OutMessage.
  Parent.bindChild(block, {
    ...keyedBaseConfig,
    outMessage: { forward: () => undefined },
  })

  // @ts-expect-error An unknown forwarding contract erases the parent OutMessage.
  Parent.bindChild(block, {
    ...keyedBaseConfig,
    outMessage: { forward: (): unknown => undefined },
  })

  // @ts-expect-error An any forwarding contract erases the parent OutMessage.
  Parent.bindChild(block, {
    ...keyedBaseConfig,
    // oxlint-disable-next-line effecttsgo/any-unknown-in-error-context
    outMessage: { forward: (): any => undefined },
  })
}

describe('bound OutMessage context', () => {
  it('preserves the previous parent Model for static folds and exposed operations', () => {
    const results = [
      boundCounter.fold(initialModel, CounterMessage.ClickedReset()),
      boundCounter.reset()(initialModel),
    ]
    for (const result of results) {
      expect(result.model.counter.count).toBe(0)
      expect(result.model.previousCount).toBe(3)
    }
  })

  it('preserves the previous parent Model for keyed folds and exposed operations', () => {
    const results = [
      entries.fold(initialModel, 1, CounterMessage.ClickedReset()),
      entries.reset(1)(initialModel),
    ]
    for (const result of results) {
      expect(result.model.entries).toEqual([{ id: 1, counter: { count: 0 } }])
      expect(result.model.previousCount).toBe(5)
    }
    expect(entries).not.toHaveProperty('step')
    expectTypeOf(entries.reset).parameters.toEqualTypeOf<[key: number]>()
    expectTypeOf<
      'step' extends keyof typeof entries ? true : false
    >().toEqualTypeOf<false>()
  })
})

describe('bound Step sequencing', () => {
  it('threads each projected Step Model forward and retains Commands in order', () => {
    const result = Update.combine([
      sequencedCounterBinding.add(2),
      sequencedCounterBinding.record(),
      sequencedCounterBinding.multiply(3),
      sequencedCounterBinding.record(),
    ])({ child: { count: 3 } })

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
