import { Array, Effect, Layer, Option, Schema } from 'effect'
import { describe, expect, expectTypeOf, it } from 'vitest'

import * as Command from '../command/index.js'
import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import * as Update from '../update/index.js'
import type { BindingRequirement } from './binding.js'
import { define } from './define.js'
import type { OperationPayload } from './operation.js'

const constructorProbe = { defaultRuns: 0 }

const Model = Schema.Struct({ value: Schema.String })
type Model = typeof Model.Type
const Message = defineMessageUnion({
  ResetValue: {},
  UpdatedValue: {
    value: Schema.String,
    source: Schema.String.pipe(
      Schema.withConstructorDefault(
        Effect.sync(() => {
          constructorProbe.defaultRuns += 1
          return 'default'
        }),
      ),
    ),
  },
  CompletedRecordValue: { value: Schema.String },
})
type Message = typeof Message.Type
const OutMessage = defineMessageUnion({
  ChangedValue: { value: Schema.String },
})
type OutMessage = typeof OutMessage.Type

const Definition = define('OperationConstructorRuntimeChild', {
  Model,
  Message,
  OutMessage,
})
const RecordValue = Definition.command('RecordValue', {
  args: { value: Schema.String },
  messages: [Message.CompletedRecordValue],
  handler: function* () {
    return ({ value }) =>
      Effect.succeed(Message.CompletedRecordValue({ value }))
  },
})
const Composition = Definition.makeComposition()
const update = Composition.makeUpdate(
  (
    model,
    message,
    required: Readonly<{ prefix: string }>,
    maybeSuffix?: string,
    separator: string = ':',
    ...indexes: ReadonlyArray<number>
  ) =>
    Message.match<
      Update.ReturnWithOutMessage<
        Model,
        Message,
        OutMessage,
        Command.HandlerOf<typeof RecordValue>
      >
    >(message, {
      ResetValue: () => ({ model: modifyFields(model, { value: () => '' }) }),
      UpdatedValue: ({ source, value }) => {
        const nextValue = `${required.prefix}${separator}${source}${separator}${value}${maybeSuffix ?? ''}${indexes.join('')}`

        return {
          model: modifyFields(model, { value: () => nextValue }),
          commands: [RecordValue({ value: nextValue })],
          outMessage: OutMessage.ChangedValue({ value: nextValue }),
        }
      },
      CompletedRecordValue: () => ({ model }),
    }),
)
const resetValue = Composition.makeOperation(Message.ResetValue)
const updateValue = Composition.makeOperation(Message.UpdatedValue)
const operations = { resetValue, updateValue }

const makeBlock = (selectedUpdate: typeof update) =>
  Composition.makeBlock({
    init: () => ({ model: Model.make({ value: '' }) }),
    update: selectedUpdate,
    operations,
    EffectsLayer: RecordValue.layer,
  })

const Block = makeBlock(update)

const Entry = Schema.Struct({ id: Schema.String, child: Model })
const ParentModel = Schema.Struct({
  maybeChild: Schema.Option(Model),
  entries: Schema.Array(Entry),
})
type ParentModel = typeof ParentModel.Type
const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: Message },
  GotEntryMessage: { id: Schema.String, message: Message },
  RequestedUpdateChild: { value: Schema.String },
  RequestedUpdateEntry: { id: Schema.String, value: Schema.String },
})
const Parent = define('OperationConstructorRuntimeParent', {
  Model: ParentModel,
  Message: ParentMessage,
})
const ChildBinding = Parent.bindChild(Block, {
  placement: 'child',
  read: model => model.maybeChild,
  write: (model, nextChild) =>
    modifyFields(model, { maybeChild: () => Option.some(nextChild) }),
  toParentMessage: message => ParentMessage.GotChildMessage({ message }),
  fromParentMessage: {
    parentMessage: ParentMessage.GotChildMessage,
    args: (_model, { message }) => Option.some([message, { prefix: 'routed' }]),
  },
  outMessage: {
    fold: OutMessage.match<Update.Step<ParentModel, typeof ParentMessage.Type>>(
      {
        ChangedValue: () => model => ({ model }),
      },
    ),
  },
})
const EntryBinding = Parent.bindChild(Block, {
  placement: 'entries',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: (model, id, nextChild) =>
    modifyFields(model, {
      entries: Array.map(entry =>
        entry.id === id ? Entry.make({ id, child: nextChild }) : entry,
      ),
    }),
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
  fromParentMessage: {
    parentMessage: ParentMessage.GotEntryMessage,
    args: (_model, { id, message }) =>
      Option.some([id, message, { prefix: 'routed' }]),
  },
  outMessage: {
    fold: (_id, outMessage) =>
      OutMessage.match<Update.Step<ParentModel, typeof ParentMessage.Type>>(
        outMessage,
        {
          ChangedValue: () => model => ({ model }),
        },
      ),
  },
})
const ParentComposition = Parent.makeComposition({
  childBindings: [ChildBinding, EntryBinding],
})
const ParentBlock = ParentComposition.makeBlock({
  init: () => ({
    model: ParentModel.make({ maybeChild: Option.none(), entries: [] }),
  }),
  update: ParentComposition.makeUpdate((model, message) =>
    ParentMessage.match(message, {
      RequestedUpdateChild: ({ value }) =>
        ChildBinding.updateValue({ value }, { prefix: 'binding' })(model),
      RequestedUpdateEntry: ({ id, value }) =>
        EntryBinding.updateValue(id, { value }, { prefix: 'binding' })(model),
    }),
  ),
  operations: {
    updateChild: ParentComposition.makeOperation(
      ParentMessage.RequestedUpdateChild,
    ),
    updateEntry: ParentComposition.makeOperation(
      ParentMessage.RequestedUpdateEntry,
    ),
  },
  EffectsLayer: Layer.empty,
})

const initialModel = Model.make({ value: '' })
const initialParent = ParentModel.make({
  maybeChild: Option.some(initialModel),
  entries: [Entry.make({ id: 'first', child: initialModel })],
})

describe('Message constructor operations', () => {
  it('constructs passively and completes one descriptor-update pair once', () => {
    const SamePair = makeBlock(update)
    const secondUpdate = Composition.makeUpdate(
      (
        model,
        message,
        required: Readonly<{ prefix: string }>,
        maybeSuffix?: string,
        separator: string = ':',
        ...indexes: ReadonlyArray<number>
      ) => update(model, message, required, maybeSuffix, separator, ...indexes),
    )
    const DifferentUpdate = makeBlock(secondUpdate)

    expect(constructorProbe.defaultRuns).toBe(0)
    expect(SamePair.operations.updateValue).toBe(Block.operations.updateValue)
    expect(DifferentUpdate.operations.updateValue).not.toBe(
      Block.operations.updateValue,
    )
    expect(
      Block.replaceEffectsLayer(RecordValue.layer).operations.updateValue,
    ).toBe(Block.operations.updateValue)
  })

  it('uses constructor input, produces the decoded Message, and appends update Context exactly', () => {
    const result = Block.operations.updateValue(
      initialModel,
      { value: 'next' },
      { prefix: 'test' },
      undefined,
      undefined,
      1,
      2,
    )

    expect(result.model.value).toBe('test:default:next12')
    expect(result.outMessage).toEqual(
      OutMessage.ChangedValue({ value: 'test:default:next12' }),
    )
    expect(constructorProbe.defaultRuns).toBe(1)
    expectTypeOf(Block.operations.updateValue).parameters.toEqualTypeOf<
      [
        model: Model,
        payload: OperationPayload<typeof Message.UpdatedValue>,
        required: Readonly<{ prefix: string }>,
        maybeSuffix?: string | undefined,
        separator?: string | undefined,
        ...indexes: ReadonlyArray<number>,
      ]
    >()
    expectTypeOf<
      Update.RequirementsOf<typeof Block.operations.updateValue>
    >().toEqualTypeOf<Command.HandlerOf<typeof RecordValue>>()
  })

  it('gives an empty constructor no payload argument', () => {
    const result = Block.operations.resetValue(initialModel, { prefix: 'test' })

    expect(result.model.value).toBe('')
    expectTypeOf(Block.operations.resetValue).parameters.toEqualTypeOf<
      [
        model: Model,
        required: Readonly<{ prefix: string }>,
        maybeSuffix?: string | undefined,
        separator?: string | undefined,
        ...indexes: ReadonlyArray<number>,
      ]
    >()
  })

  it('prepends a key for keyed Bindings and preserves absent child behavior', () => {
    const direct = ParentBlock.operations.updateChild(initialParent, {
      value: 'direct',
    })
    const keyed = ParentBlock.operations.updateEntry(initialParent, {
      id: 'first',
      value: 'entry',
    })
    const missingKey = ParentBlock.operations.updateEntry(initialParent, {
      id: 'missing',
      value: 'ignored',
    })
    const missingChild = ParentBlock.operations.updateChild(
      modifyFields(initialParent, { maybeChild: () => Option.none() }),
      { value: 'ignored' },
    )

    expect(Option.getOrThrow(direct.model.maybeChild).value).toBe(
      'binding:default:direct',
    )
    expect(Option.getOrThrow(Array.head(keyed.model.entries)).child.value).toBe(
      'binding:default:entry',
    )
    expect(missingKey.model).toBe(initialParent)
    expect(Option.isNone(missingChild.model.maybeChild)).toBe(true)
    expectTypeOf(EntryBinding.updateValue).parameters.toEqualTypeOf<
      [
        key: string,
        payload: OperationPayload<typeof Message.UpdatedValue>,
        required: Readonly<{ prefix: string }>,
        maybeSuffix?: string | undefined,
        separator?: string | undefined,
        ...indexes: ReadonlyArray<number>,
      ]
    >()
    expectTypeOf<
      Update.RegistrationEvidenceOf<
        ReturnType<ReturnType<typeof EntryBinding.updateValue>>
      >
    >().toMatchTypeOf<BindingRequirement<'entries', typeof Block>>()
  })

  it('recognizes constructors declared directly or through nested Message unions', () => {
    const SingleDefinition = define('OperationConstructorSingle', {
      Model,
      Message: Message.ResetValue,
    })
    const NestedDefinition = define('OperationConstructorNested', {
      Model,
      Message: Schema.Union([
        Message.ResetValue,
        Schema.Union([Message.UpdatedValue, Message.CompletedRecordValue]),
      ]),
    })
    const SingleComposition = SingleDefinition.makeComposition()
    const NestedComposition = NestedDefinition.makeComposition()

    expect(() =>
      SingleComposition.makeOperation(Message.ResetValue),
    ).not.toThrow()
    expect(() =>
      NestedComposition.makeOperation(Message.UpdatedValue),
    ).not.toThrow()
  })

  it('rejects routed, foreign, wrong-owner, reserved, and malformed descriptors', () => {
    const ForeignMessage = defineMessageUnion({ UpdatedForeignValue: {} })
    const SameIdDefinition = define('OperationConstructorRuntimeSameId', {
      Model,
      Message,
    })
    const FirstComposition = SameIdDefinition.makeComposition()
    const SecondComposition = define('OperationConstructorRuntimeSameId', {
      Model,
      Message,
    }).makeComposition()
    const foreignOwnerOperation = FirstComposition.makeOperation(
      Message.ResetValue,
    )
    const dynamicReservedName: string = 'fold'
    const SameShapeMessage = defineMessageUnion({
      UpdatedValue: {
        value: Schema.String,
        source: Schema.String.pipe(
          Schema.withConstructorDefault(Effect.succeed('foreign')),
        ),
      },
    })

    expect(() =>
      Reflect.apply(ParentComposition.makeOperation, undefined, [
        ParentMessage.GotChildMessage,
      ]),
    ).toThrow(/Got|routed|authored/)
    expect(() =>
      Reflect.apply(Composition.makeOperation, undefined, [
        ForeignMessage.UpdatedForeignValue,
      ]),
    ).toThrow(/declared Message Schema/)
    expect(() =>
      Composition.makeOperation(SameShapeMessage.UpdatedValue),
    ).toThrow(/same-shaped|declared Message Schema/)

    expect(() =>
      Reflect.apply(Composition.makeOperation, undefined, [
        Schema.TaggedStruct('UpdatedValue', { value: Schema.String }),
      ]),
    ).toThrow(/callable|Message constructor/)
    expect(() =>
      Reflect.apply(Composition.makeOperation, undefined, [() => ({})]),
    ).toThrow(/callable|Message constructor/)
    expect(() =>
      Reflect.apply(SecondComposition.makeBlock, undefined, [
        {
          init: () => ({ model: initialModel }),
          update,
          operations: { resetValue: foreignOwnerOperation },
          EffectsLayer: RecordValue.layer,
        },
      ]),
    ).toThrow(/owner|Composition/)
    expect(() =>
      Reflect.apply(Composition.makeBlock, undefined, [
        {
          init: () => ({ model: initialModel }),
          update,
          operations: { [dynamicReservedName]: updateValue },
          EffectsLayer: RecordValue.layer,
        },
      ]),
    ).toThrow(/operation name "fold"|collides/)
    expect(() =>
      Reflect.apply(Composition.makeBlock, undefined, [
        {
          init: () => ({ model: initialModel }),
          update,
          operations: { malformed: {} },
          EffectsLayer: RecordValue.layer,
        },
      ]),
    ).toThrow(/operation|descriptor|producer/)
    expect(() =>
      Reflect.apply(Composition.makeBlock, undefined, [
        {
          init: () => ({ model: initialModel }),
          update,
          expose: { updateValue },
          EffectsLayer: RecordValue.layer,
        },
      ]),
    ).toThrow(/removed "expose" field.*"operations"/)

    const BypassBlock = Reflect.apply(ParentComposition.makeBlock, undefined, [
      {
        init: ParentBlock.init,
        update: ParentBlock.update,
        operations: {
          bypass: () => [
            ParentMessage.GotChildMessage({
              message: Message.ResetValue(),
            }),
          ],
        },
        EffectsLayer: Layer.empty,
      },
    ])

    expect(() => BypassBlock.operations.bypass(initialParent)).toThrow(
      /cannot publish child wrapper Message/,
    )
  })
})
