import { Array, Effect, Number, Schema } from 'effect'
import { expect, expectTypeOf, it } from 'vitest'

import * as Command from '../command/index.js'
import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import * as Update from '../update/public.js'
import * as Block from './public.js'

const Choice = Schema.Literals(['Apple', 'Pear'])
const ChildModel = Schema.Struct({ count: Schema.Number })
const ChildMessage = defineMessageUnion({
  RequestedSelect: { value: Choice },
  RequestedClose: {},
  CompletedObserveSelection: {},
})
const ChildOutMessage = defineMessageUnion({
  Selected: { value: Choice },
  Closed: {},
})
const FoldChildDefinition = Block.makeDefinition('FoldChild', {
  Model: ChildModel,
  Message: ChildMessage,
  OutMessage: ChildOutMessage,
})
const ObserveSelection = FoldChildDefinition.command('ObserveSelection', {
  messages: [ChildMessage.CompletedObserveSelection],
  handler: function* () {
    return () => Effect.succeed(ChildMessage.CompletedObserveSelection())
  },
})
const FoldChildComposition = FoldChildDefinition.makeComposition()
const ChildBlock = FoldChildComposition.assembleBlock({
  init: () => ({ model: ChildModel.make({ count: 0 }) }),
  update: FoldChildComposition.makeUpdate((model, message) =>
    ChildMessage.match(message, {
      RequestedSelect: ({ value }) => ({
        model: modifyFields(model, { count: Number.increment }),
        outMessage: ChildOutMessage.Selected({ value }),
      }),
      RequestedClose: () => ({ model, outMessage: ChildOutMessage.Closed() }),
      CompletedObserveSelection: () => ({ model }),
    }),
  ),
  operations: {
    requestSelect: ChildMessage.RequestedSelect,
    requestClose: ChildMessage.RequestedClose,
  },
  EffectsLayer: ObserveSelection.layer,
})

const Model = Schema.Struct({
  child: ChildBlock.Model,
  sibling: ChildBlock.Model,
  choice: Choice,
  previousCount: Schema.Number,
})
const Message = defineMessageUnion({
  RequestedSelect: { value: Choice },
  CompletedRecordChoice: {},
})
const OutMessage = defineMessageUnion({ Chose: { value: Choice } })
const ForeignOutMessage = defineMessageUnion({ Escaped: {} })
const FoldParentDefinition = Block.makeDefinition('FoldParent', {
  Model,
  Message,
  OutMessage,
})
const RecordChoice = FoldParentDefinition.command('RecordChoice', {
  args: { value: Choice },
  messages: [Message.CompletedRecordChoice],
  handler: function* () {
    return () => Effect.succeed(Message.CompletedRecordChoice())
  },
})
const initialModel = Model.make({
  child: ChildModel.make({ count: 0 }),
  sibling: ChildModel.make({ count: 0 }),
  choice: 'Apple',
  previousCount: 0,
})

it('infers exact child payloads and the parent Model without running a transition during authoring', () => {
  let transitions = 0
  const fold = FoldParentDefinition.makeOutMessageFold(ChildBlock, {
    Selected:
      ({ value }) =>
      model => {
        expectTypeOf(value).toEqualTypeOf<'Apple' | 'Pear'>()
        expectTypeOf(model.choice).toEqualTypeOf<'Apple' | 'Pear'>()
        transitions += 1
        return { model: modifyFields(model, { choice: () => value }) }
      },
    Closed: () => FoldParentDefinition.stepNoop(),
  })

  expect(transitions).toBe(0)
  const selected = fold(ChildOutMessage.Selected({ value: 'Pear' }))(
    initialModel,
  )

  expect(selected.model.choice).toBe('Pear')
  expect(initialModel.choice).toBe('Apple')
  expect(transitions).toBe(1)
  expect(fold(ChildOutMessage.Closed())(initialModel).model).toBe(initialModel)
  expectTypeOf<
    Update.RequirementsOf<ReturnType<typeof fold>>
  >().toEqualTypeOf<never>()
})

it('contextually types literal Model fields in folds and authored updates', () => {
  const Model = Schema.Struct({ phase: Schema.Literals(['Idle', 'Done']) })
  const Message = defineMessageUnion({
    RequestedFinish: {},
    RequestedReset: {},
  })
  const LiteralFoldDefinition = Block.makeDefinition('LiteralFold', {
    Model,
    Message,
  })
  const LiteralFoldComposition = LiteralFoldDefinition.makeComposition()
  const fold = LiteralFoldDefinition.makeOutMessageFold(ChildBlock, {
    Selected: () => _model => ({ model: { phase: 'Done' } }),
    Closed: () => _model => ({ model: { phase: 'Idle' } }),
  })
  const update = LiteralFoldComposition.makeUpdate((_model, message) =>
    message._tag === 'RequestedFinish'
      ? { model: { phase: 'Done' } }
      : { model: { phase: 'Idle' } },
  )
  const matcherUpdate = LiteralFoldComposition.makeUpdate((_model, message) =>
    Message.match<Update.Return<typeof Model.Type, typeof Message.Type>>(
      message,
      {
        RequestedFinish: () => ({ model: { phase: 'Done' } }),
        RequestedReset: () => ({ model: { phase: 'Idle' } }),
      },
    ),
  )
  const initialModel = Model.make({ phase: 'Idle' })

  expect(
    fold(ChildOutMessage.Selected({ value: 'Apple' }))(initialModel).model
      .phase,
  ).toBe('Done')
  expect(update(initialModel, Message.RequestedFinish()).model.phase).toBe(
    'Done',
  )
  expectTypeOf<ReturnType<typeof update>['model']['phase']>().toEqualTypeOf<
    'Idle' | 'Done'
  >()
  expect(
    matcherUpdate(initialModel, Message.RequestedFinish()).model.phase,
  ).toBe('Done')
  if (false) {
    LiteralFoldComposition.makeUpdate((_model, _message) => ({
      // @ts-expect-error Contextual typing cannot admit an undeclared Model literal.
      model: { phase: 'Unknown' },
    }))
  }
})

it('retains Command requirements and derived parent OutMessages beside pure branches', () => {
  const fold = FoldParentDefinition.makeOutMessageFold(ChildBlock, {
    Selected:
      ({ value }) =>
      model => ({
        model: modifyFields(model, { choice: () => value }),
        commands: [RecordChoice({ value })],
        outMessage: OutMessage.Chose({ value }),
      }),
    Closed: () => FoldParentDefinition.stepNoop(),
  })

  expectTypeOf<Update.RequirementsOf<ReturnType<typeof fold>>>().toEqualTypeOf<
    Command.HandlerOf<typeof RecordChoice>
  >()

  const ChildBinding = FoldParentDefinition.bindChild(ChildBlock, {
    field: 'child',
    outMessage: { fold },
  })
  const FoldParentComposition = FoldParentDefinition.makeComposition({
    bindings: [ChildBinding],
  })
  const update = FoldParentComposition.makeUpdate((model, message) =>
    Message.match(message, {
      RequestedSelect: ({ value }) =>
        ChildBinding.requestSelect({ value })(model),
      CompletedRecordChoice: () => ({ model }),
    }),
  )
  const ParentBlock = FoldParentComposition.assembleBlock({
    init: () => ({ model: initialModel }),
    update,
    operations: { requestSelect: Message.RequestedSelect },
    EffectsLayer: RecordChoice.layer,
  })
  const selected = ParentBlock.operations.requestSelect(initialModel, {
    value: 'Pear',
  })

  expect(selected.model.child.count).toBe(1)
  expect(selected.model.choice).toBe('Pear')
  expect(selected.outMessage).toEqual(OutMessage.Chose({ value: 'Pear' }))
  expect(selected.commands).toHaveLength(1)
  expectTypeOf<
    Update.RequirementsOf<typeof ParentBlock.update>
  >().toEqualTypeOf<Command.HandlerOf<typeof RecordChoice>>()
})

it('accepts valid conditional Step and result unions without widening requirements', () => {
  const fold = FoldParentDefinition.makeOutMessageFold(ChildBlock, {
    Selected:
      ({ value }) =>
      model => {
        if (model.choice === value) {
          return { model }
        }

        return {
          model: modifyFields(model, { choice: () => value }),
          commands: [RecordChoice({ value })],
          outMessage: OutMessage.Chose({ value }),
        }
      },
    Closed: () => FoldParentDefinition.stepNoop(),
  })

  expectTypeOf<Update.RequirementsOf<ReturnType<typeof fold>>>().toEqualTypeOf<
    Command.HandlerOf<typeof RecordChoice>
  >()
})

it('rejects every invalid member of mixed Step and result unions', () => {
  if (false) {
    const validStep = FoldParentDefinition.stepNoop()
    const wrongModelStep = (model: typeof Model.Type) => {
      if (model.choice === 'Apple') {
        return { model }
      }

      return { model: ChildModel.make({ count: 0 }) }
    }
    const foreignCommandStep = (model: typeof Model.Type) => {
      if (model.choice === 'Apple') {
        return { model }
      }

      return { model, commands: [ObserveSelection()] }
    }
    const foreignOutMessageStep = (model: typeof Model.Type) => {
      if (model.choice === 'Apple') {
        return { model }
      }

      return { model, outMessage: ForeignOutMessage.Escaped() }
    }
    const ExtendedModel = Schema.Struct({
      ...Model.fields,
      extra: Schema.String,
    })
    const narrowerInputStep = (_model: typeof ExtendedModel.Type) => ({
      model: initialModel,
    })
    const unknownEvidenceStep = (
      _model: typeof Model.Type,
    ): Update.ReturnWithRegistrationEvidence<
      typeof Model.Type,
      typeof Message.Type,
      never,
      never,
      unknown
    > => ({ model: initialModel })
    const mixedStep =
      globalThis.Math.random() > 0.5 ? validStep : narrowerInputStep

    const unknownCommands: unknown = undefined
    FoldParentDefinition.makeOutMessageFold(ChildBlock, {
      // @ts-expect-error Command collections cannot widen to unknown.
      Selected: () => model => ({ model, commands: unknownCommands }),
      Closed: () => validStep,
    })
    FoldParentDefinition.makeOutMessageFold(ChildBlock, {
      // @ts-expect-error Command collections must be arrays of Commands.
      Selected: () => model => ({ model, commands: { unexpected: true } }),
      Closed: () => validStep,
    })
    // @ts-expect-error A Definition is not a completed child Block.
    FoldParentDefinition.makeOutMessageFold(FoldChildDefinition, {})

    FoldParentDefinition.makeOutMessageFold(ChildBlock, {
      // @ts-expect-error Every returned Model member must match the parent Model.
      Selected: () => wrongModelStep,
      Closed: () => validStep,
    })

    FoldParentDefinition.makeOutMessageFold(ChildBlock, {
      // @ts-expect-error Every Command member must produce the parent Message.
      Selected: () => foreignCommandStep,
      Closed: () => validStep,
    })

    FoldParentDefinition.makeOutMessageFold(ChildBlock, {
      // @ts-expect-error Every OutMessage member must match the parent OutMessage.
      Selected: () => foreignOutMessageStep,
      Closed: () => validStep,
    })

    FoldParentDefinition.makeOutMessageFold(ChildBlock, {
      // @ts-expect-error Every possible Step input must match the parent graph input.
      Selected: () => mixedStep,
      Closed: () => validStep,
    })

    FoldParentDefinition.makeOutMessageFold(ChildBlock, {
      // @ts-expect-error A result cannot erase its Binding registration evidence.
      Selected: () => unknownEvidenceStep,
      Closed: () => validStep,
    })

    FoldParentDefinition.makeOutMessageFold(ChildBlock, {
      // @ts-expect-error The returned Step must produce a result, not another Step.
      Selected: () => _model => FoldParentDefinition.stepNoop(),
      Closed: () => validStep,
    })

    FoldParentDefinition.makeOutMessageFold(ChildBlock, {
      // @ts-expect-error Each variant must return a Step; never cannot disappear from the fold.
      Selected: () => {
        throw new Error('Missing transition')
      },
      Closed: () => validStep,
    })
  }
})

it('keeps sibling registration obligations when an exhaustive fold returns connected Steps', () => {
  const SiblingBinding = FoldParentDefinition.bindChild(ChildBlock, {
    field: 'sibling',
    outMessage: {
      fold: FoldParentDefinition.makeOutMessageFold(ChildBlock, {
        Selected: () => FoldParentDefinition.stepNoop(),
        Closed: () => FoldParentDefinition.stepNoop(),
      }),
    },
  })
  const fold = FoldParentDefinition.makeOutMessageFold(ChildBlock, {
    Selected: ({ value }) => SiblingBinding.requestSelect({ value }),
    Closed: () => FoldParentDefinition.stepNoop(),
  })
  const ChildBinding = FoldParentDefinition.bindChild(ChildBlock, {
    field: 'child',
    outMessage: { fold },
  })
  const FoldSiblingComposition = FoldParentDefinition.makeComposition({
    bindings: [ChildBinding, SiblingBinding],
  })
  const ParentBlock = FoldSiblingComposition.assembleBlock({
    init: () => ({ model: initialModel }),
    update: FoldSiblingComposition.makeUpdate((model, message) =>
      Message.match(message, {
        RequestedSelect: ({ value }) =>
          ChildBinding.requestSelect({ value })(model),
        CompletedRecordChoice: () => ({ model }),
      }),
    ),
    operations: { requestSelect: Message.RequestedSelect },
  })
  const selected = ParentBlock.operations.requestSelect(initialModel, {
    value: 'Pear',
  })

  expect(selected.model.child.count).toBe(1)
  expect(selected.model.sibling.count).toBe(1)

  if (false) {
    // @ts-expect-error The fold's sibling operation still requires its Binding.
    FoldParentDefinition.makeComposition({ bindings: [ChildBinding] })

    FoldSiblingComposition.makeUpdate((model, message) =>
      // @ts-expect-error A pure branch cannot hide an unapplied connected Step in another branch.
      Message.match(message, {
        RequestedSelect: ({ value }) => ChildBinding.requestSelect({ value }),
        CompletedRecordChoice: () => ({ model }),
      }),
    )
  }
})

it('contextually types FoldContext and preserves lifted Command requirements', () => {
  const fold = FoldParentDefinition.makeOutMessageFold(ChildBlock, {
    Selected:
      (_outMessage, { liftCommand, modelBeforeUpdate }) =>
      model => ({
        model: modifyFields(model, {
          previousCount: () => modelBeforeUpdate.child.count,
        }),
        commands: [liftCommand(ObserveSelection())],
      }),
    Closed: () => FoldParentDefinition.stepNoop(),
  })
  expectTypeOf<Update.RequirementsOf<ReturnType<typeof fold>>>().toEqualTypeOf<
    Command.HandlerOf<typeof ObserveSelection>
  >()

  const selected = fold(ChildOutMessage.Selected({ value: 'Pear' }), {
    modelBeforeUpdate: initialModel,
    liftCommand: command =>
      Command.mapMessage(command, () => Message.CompletedRecordChoice()),
    liftCommands: commands =>
      Command.mapMessages(commands, () => Message.CompletedRecordChoice()),
  })(
    modifyFields(initialModel, {
      child: () => ChildModel.make({ count: 1 }),
    }),
  )

  expect(selected.model.previousCount).toBe(0)
  expect(selected.model.child.count).toBe(1)
  expect(selected.commands).toHaveLength(1)

  if (false) {
    // @ts-expect-error A context-consuming fold cannot be invoked without its lifters.
    fold(ChildOutMessage.Selected({ value: 'Apple' }))
  }
})

it('executes an initialized sibling through an owned Step and retains its graph requirement', () => {
  const SiblingBinding = FoldParentDefinition.bindChild(ChildBlock, {
    field: 'sibling',
    outMessage: {
      fold: FoldParentDefinition.makeOutMessageFold(ChildBlock, {
        Selected: () => FoldParentDefinition.stepNoop(),
        Closed: () => FoldParentDefinition.stepNoop(),
      }),
    },
  })
  const fold = FoldParentDefinition.makeOutMessageFold(ChildBlock, {
    Selected: () =>
      FoldParentDefinition.step(model =>
        SiblingBinding.init({
          args: [],
          toParentModel: sibling =>
            modifyFields(model, { sibling: () => sibling }),
        }),
      ),
    Closed: () => FoldParentDefinition.stepNoop(),
  })
  const ChildBinding = FoldParentDefinition.bindChild(ChildBlock, {
    field: 'child',
    outMessage: { fold },
  })
  const FoldInitializedSiblingComposition =
    FoldParentDefinition.makeComposition({
      bindings: [ChildBinding, SiblingBinding],
    })
  const ParentBlock = FoldInitializedSiblingComposition.assembleBlock({
    init: () => ({ model: initialModel }),
    update: FoldInitializedSiblingComposition.makeUpdate((model, message) =>
      Message.match(message, {
        RequestedSelect: ({ value }) =>
          ChildBinding.requestSelect({ value })(model),
        CompletedRecordChoice: () => ({ model }),
      }),
    ),
    operations: { requestSelect: Message.RequestedSelect },
  })
  const selected = ParentBlock.operations.requestSelect(
    modifyFields(initialModel, {
      sibling: () => ChildModel.make({ count: 5 }),
    }),
    { value: 'Pear' },
  )

  expect(selected.model.child.count).toBe(1)
  expect(selected.model.sibling.count).toBe(0)

  if (false) {
    // @ts-expect-error The initialized sibling still needs its registered Binding.
    FoldParentDefinition.makeComposition({ bindings: [ChildBinding] })

    FoldParentDefinition.makeOutMessageFold(ChildBlock, {
      // @ts-expect-error A raw init recipe needs Definition.step's normalization.
      Selected: () => model =>
        SiblingBinding.init({
          args: [],
          toParentModel: sibling =>
            modifyFields(model, { sibling: () => sibling }),
        }),
      Closed: () => FoldParentDefinition.stepNoop(),
    })
  }
})

it('rejects erased invalid configuration before calling a variant handler', () => {
  const makeFold = FoldParentDefinition.makeOutMessageFold
  const noop = () => FoldParentDefinition.stepNoop()

  expect(() => Reflect.apply(makeFold, undefined, [{}, {}])).toThrow(
    'completed child Block',
  )
  expect(() =>
    Reflect.apply(makeFold, undefined, [
      FoldChildDefinition,
      { Selected: noop, Closed: noop },
    ]),
  ).toThrow('completed child Block')
  expect(() =>
    Reflect.apply(makeFold, undefined, [ChildBlock, { Selected: noop }]),
  ).toThrow('missing handlers for: Closed')
  expect(() =>
    Reflect.apply(makeFold, undefined, [
      ChildBlock,
      { Selected: noop, Closed: noop, Unexpected: noop },
    ]),
  ).toThrow('unexpected handlers for: Unexpected')
  expect(() =>
    Reflect.apply(makeFold, undefined, [
      ChildBlock,
      { Selected: noop, Closed: true },
    ]),
  ).toThrow('handler "Closed" must be a function')
  expect(() =>
    Reflect.apply(makeFold, undefined, [
      ChildBlock,
      Object.create({ Selected: noop, Closed: noop }),
    ]),
  ).toThrow('missing handlers for: Selected, Closed')

  const fold = makeFold(ChildBlock, { Selected: noop, Closed: noop })
  expect(() => Reflect.apply(fold, undefined, [{ _tag: 'toString' }])).toThrow(
    'has no handler for child OutMessage "toString"',
  )
})

it('keeps keyed parent policy explicit and ignores operations on removed instances', () => {
  const InstanceId = Schema.Literals(['First', 'Second'])
  const Instance = Schema.Struct({ id: InstanceId, child: ChildBlock.Model })
  const KeyedModel = Schema.Struct({
    instances: Schema.Array(Instance),
    choice: Choice,
  })
  const KeyedMessage = defineMessageUnion({
    RequestedSelect: { id: InstanceId, value: Choice },
    RequestedRemove: { id: InstanceId },
  })
  const FoldKeyedDefinition = Block.makeDefinition('FoldKeyed', {
    Model: KeyedModel,
    Message: KeyedMessage,
  })
  const InstancesBinding = FoldKeyedDefinition.bindChild(ChildBlock, {
    field: 'instances',
    key: 'id',
    childField: 'child',
    outMessage: {
      fold: (id, outMessage) =>
        FoldKeyedDefinition.makeOutMessageFold(ChildBlock, {
          Selected:
            ({ value }) =>
            model => ({
              model: modifyFields(model, { choice: () => value }),
            }),
          Closed: () =>
            FoldKeyedDefinition.stepFields(() => ({
              instances: Array.filter(instance => instance.id !== id),
            })),
        })(outMessage),
    },
  })
  const FoldKeyedComposition = FoldKeyedDefinition.makeComposition({
    bindings: [InstancesBinding],
  })
  const model = KeyedModel.make({
    instances: [
      Instance.make({ id: 'First', child: ChildModel.make({ count: 0 }) }),
      Instance.make({ id: 'Second', child: ChildModel.make({ count: 0 }) }),
    ],
    choice: 'Apple',
  })
  const ParentBlock = FoldKeyedComposition.assembleBlock({
    init: () => ({ model }),
    update: FoldKeyedComposition.makeUpdate((model, message) =>
      KeyedMessage.match(message, {
        RequestedSelect: ({ id, value }) =>
          InstancesBinding.requestSelect(id, { value })(model),
        RequestedRemove: ({ id }) => InstancesBinding.requestClose(id)(model),
      }),
    ),
    operations: {
      requestSelect: KeyedMessage.RequestedSelect,
      requestRemove: KeyedMessage.RequestedRemove,
    },
  })
  const selected = ParentBlock.operations.requestSelect(model, {
    id: 'First',
    value: 'Pear',
  })
  const removed = ParentBlock.operations.requestRemove(selected.model, {
    id: 'First',
  })
  const stale = ParentBlock.operations.requestSelect(removed.model, {
    id: 'First',
    value: 'Apple',
  })

  expect(selected.model.choice).toBe('Pear')
  expect(removed.model.instances).toEqual([
    Instance.make({ id: 'Second', child: ChildModel.make({ count: 0 }) }),
  ])
  expect(stale.model).toBe(removed.model)

  if (false) {
    // @ts-expect-error The keyed operation retains the parent Schema's exact ID type.
    InstancesBinding.requestClose('Third')
  }
})
