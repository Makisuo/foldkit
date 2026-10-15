import { Context, Effect, Schema } from 'effect'

import { Block, Message, Struct, Update } from '../src/index.js'

export class ChoiceService extends Context.Service<
  ChoiceService,
  Readonly<{ refresh: Effect.Effect<void> }>
>()('DeclarationWrappedKeyedFieldChoiceService') {}

export class ChoiceBuildFailure extends Error {}

const choiceHandlerConstruction: Effect.Effect<void, ChoiceBuildFailure> =
  Effect.void

const makeChoice = <const Values extends ReadonlyArray<string>>(
  Value: Schema.Literals<Values>,
) => {
  type Value = Values[number]

  const Model = Schema.Struct({ value: Value })
  const ChoiceMessage = Message.defineMessageUnion({
    UpdatedValue: { value: Value },
    CompletedRefresh: {},
  })
  const ChoiceOutMessage = Message.defineMessageUnion({
    SelectedValue: { value: Value },
  })
  const Choice = Block.define('DeclarationWrappedKeyedFieldChoice', {
    Model,
    Message: ChoiceMessage,
    OutMessage: ChoiceOutMessage,
  })
  const ReadChoice = Choice.command('ReadChoice', {
    messages: [ChoiceMessage.CompletedRefresh],
    handler: function* () {
      const service = yield* ChoiceService
      yield* choiceHandlerConstruction

      return () =>
        service.refresh.pipe(Effect.as(ChoiceMessage.CompletedRefresh()))
    },
  })
  const setValue = Choice.step((model, value: Value) => ({
    model: Struct.modifyFields(model, { value: () => value }),
  }))
  const refresh = Choice.step(model => ({
    model,
    commands: [ReadChoice()],
  }))
  const select = Choice.step(model => ({
    model,
    outMessage: ChoiceOutMessage.SelectedValue({ value: model.value }),
  }))
  const block = Choice.toComposition().toBlock({
    init: (value: Value) => ({ model: Model.make({ value }) }),
    update: Choice.update((model, message) =>
      ChoiceMessage.match(message, {
        UpdatedValue: ({ value }) => setValue(model, value),
        CompletedRefresh: () => ({ model }),
      }),
    ),
    expose: { setValue, refresh, select },
    EffectsLayer: ReadChoice.layer,
  })

  return {
    block,
    Message: ChoiceMessage,
    OutMessage: ChoiceOutMessage,
    ReadChoice,
  }
}

export const Choice = makeChoice(Schema.Literals(['One', 'Two']))

const PlainChoice = Block.define('DeclarationWrappedKeyedFieldPlainChoice', {
  Model: Choice.block.Model,
  Message: Choice.Message,
})
export const PlainChoiceBlock = PlainChoice.toComposition().toBlock({
  init: () => ({ model: Choice.block.Model.make({ value: 'One' }) }),
  update: PlainChoice.update((model, message) =>
    Choice.Message.match(message, {
      UpdatedValue: ({ value }) => ({
        model: Struct.modifyFields(model, { value: () => value }),
      }),
      CompletedRefresh: () => ({ model }),
    }),
  ),
})

export const ChoiceId = Schema.String.pipe(
  Schema.brand('DeclarationWrappedKeyedFieldChoiceId'),
)
export const ChoiceEntry = Schema.Struct({
  id: ChoiceId,
  choice: Choice.block.Model,
  note: Schema.optionalKey(Schema.String),
})
export const LiteralChoiceEntry = Schema.Struct({
  kind: Schema.Literals(['Primary', 'Secondary']),
  choice: Choice.block.Model,
})

export const TextMessage = Message.defineMessageUnion({
  ReplacedText: { value: Schema.String },
})
const Text = Block.define('DeclarationWrappedKeyedFieldText', {
  Model: Schema.String,
  Message: TextMessage,
})
export const TextBlock = Text.toComposition().toBlock({
  init: () => ({ model: '' }),
  update: Text.update((_model, { value }) => ({ model: value })),
})
export const TextEntry = Schema.Struct({
  id: Schema.String,
  text: Schema.String,
})

export const ParentModel = Schema.Struct({
  choices: Schema.Array(ChoiceEntry),
  plainChoices: Schema.Array(ChoiceEntry),
  literalChoices: Schema.Array(LiteralChoiceEntry),
  textEntries: Schema.Array(TextEntry),
})
export const ParentMessage = Message.defineMessageUnion({
  GotChoiceMessage: { id: ChoiceId, message: Choice.Message },
  GotLiteralChoiceMessage: {
    kind: Schema.Literals(['Primary', 'Secondary']),
    message: Choice.Message,
  },
  GotTextMessage: { id: Schema.String, message: TextMessage },
})
export const Parent = Block.define('DeclarationWrappedKeyedFieldParent', {
  Model: ParentModel,
  Message: ParentMessage,
})

export const makePayloadParent = <A, I>(payloadSchema: Schema.Codec<A, I>) => {
  const Entry = Schema.Struct({
    id: ChoiceId,
    choice: Choice.block.Model,
    payload: payloadSchema,
  })
  const Model = Schema.Struct({ entries: Schema.Array(Entry) })
  const PayloadParent = Block.define(
    'DeclarationWrappedKeyedFieldPayloadParent',
    {
      Model,
      Message: ParentMessage,
    },
  )
  const binding = PayloadParent.bindChild(PlainChoiceBlock, {
    field: 'entries',
    key: 'id',
    childField: 'choice',
    toParentMessage: (id, message) =>
      ParentMessage.GotChoiceMessage({ id, message }),
  })

  return { binding, Model }
}

export const payloadParent = makePayloadParent(
  Schema.Struct({ label: Schema.String }),
)

export const firstChoiceId = Schema.decodeUnknownSync(ChoiceId)('first')

export const toChoiceMessage = (
  id: typeof ChoiceId.Type,
  message: typeof Choice.Message.Type,
) => ParentMessage.GotChoiceMessage({ id, message })

export const choiceOutMessagePolicy = {
  fold: (
    id: typeof ChoiceId.Type,
    outMessage: typeof Choice.OutMessage.Type,
    {
      liftCommand,
    }: Update.FoldContext<
      typeof Choice.Message.Type,
      typeof ParentMessage.Type,
      typeof ParentModel.Type
    >,
  ) => {
    const exactId: typeof ChoiceId.Type = id
    void exactId

    return Choice.OutMessage.match(outMessage, {
      SelectedValue: ({ value }) =>
        Parent.step(model => {
          const exactValue: 'One' | 'Two' = value
          void exactValue

          return {
            model,
            commands: [liftCommand(Choice.ReadChoice())],
          }
        }),
    })
  },
}

export const choices = Parent.bindChild(Choice.block, {
  field: 'choices',
  key: 'id',
  childField: 'choice',
  toParentMessage: toChoiceMessage,
  subscriptions: {
    when: (model, id) => {
      const exactModel: typeof ParentModel.Type = model
      const exactId: typeof ChoiceId.Type = id
      void exactModel
      void exactId

      return true
    },
  },
  outMessage: choiceOutMessagePolicy,
})

export const plainChoices = Parent.bindChild(PlainChoiceBlock, {
  field: 'plainChoices',
  key: 'id',
  childField: 'choice',
  toParentMessage: toChoiceMessage,
})

export const literalChoices = Parent.bindChild(Choice.block, {
  field: 'literalChoices',
  key: 'kind',
  childField: 'choice',
  toParentMessage: (kind, message) =>
    ParentMessage.GotLiteralChoiceMessage({ kind, message }),
  outMessage: {
    fold: (kind, outMessage) => {
      const exactKind: 'Primary' | 'Secondary' = kind
      const exactOutMessage: typeof Choice.OutMessage.Type = outMessage
      void exactKind
      void exactOutMessage

      return model => ({ model })
    },
  },
})

export const textEntries = Parent.bindChild(TextBlock, {
  field: 'textEntries',
  key: 'id',
  childField: 'text',
  toParentMessage: (id, message) =>
    ParentMessage.GotTextMessage({ id, message }),
})

export const choiceInspection = Block.inspectBinding(choices)

export const composition = Parent.toComposition({
  children: [choices, plainChoices, literalChoices, textEntries],
})

export const initialParentModel = ParentModel.make({
  choices: [
    ChoiceEntry.make({
      id: firstChoiceId,
      choice: Choice.block.Model.make({ value: 'One' }),
    }),
  ],
  plainChoices: [],
  literalChoices: [
    LiteralChoiceEntry.make({
      kind: 'Primary',
      choice: Choice.block.Model.make({ value: 'Two' }),
    }),
  ],
  textEntries: [TextEntry.make({ id: 'text', text: 'initial' })],
})

choices.fold(
  initialParentModel,
  firstChoiceId,
  Choice.Message.UpdatedValue({ value: 'Two' }),
)
choices.setValue(firstChoiceId, 'One')(initialParentModel)
literalChoices.select('Primary')(initialParentModel)
textEntries.fold(
  initialParentModel,
  'text',
  TextMessage.ReplacedText({ value: 'next' }),
)
