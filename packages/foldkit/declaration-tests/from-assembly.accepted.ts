import { Context, Effect, Layer, Schema } from 'effect'
import { Block, Message as MessageModule, Struct } from 'foldkit'

export class Store extends Context.Service<
  Store,
  Readonly<{ saveCount: (count: number) => Effect.Effect<void> }>
>()('FromAssembly/Store') {}

export const Model = Schema.Struct({ count: Schema.Number })
export const ViewInputs = Schema.Struct({ label: Schema.String })
export const Message = MessageModule.defineMessageUnion({
  RequestedSetCount: { count: Schema.Number },
  CompletedSaveCount: {},
  CompletedObservePanel: {},
})
export const OutMessage = MessageModule.defineMessageUnion({
  ChangedCount: { count: Schema.Number },
})

export const CountDefinition = Block.makeDefinition('FromAssemblyCount', {
  Model,
  Message,
})

export const ReportingCountDefinition = Block.makeDefinition(
  'FromAssemblyReportingCount',
  { Model, Message, OutMessage },
)

export const SaveCount = CountDefinition.makeCommand('SaveCount', {
  args: { count: Message.RequestedSetCount.fields.count },
  messages: [Message.CompletedSaveCount],
  handler: function* () {
    const store = yield* Store

    return ({ count }) =>
      Effect.as(store.saveCount(count), Message.CompletedSaveCount())
  },
})

export const ObservePanel = CountDefinition.makeMount('ObservePanel', {
  messages: [Message.CompletedObservePanel],
  handler: function* () {
    return () => Effect.succeed(Message.CompletedObservePanel())
  },
})

export const CountComposition = CountDefinition.makeComposition({
  mounts: [ObservePanel],
})

export const init = CountComposition.makeInit(() => ({
  model: Model.make({ count: 0 }),
}))

export const update = CountComposition.makeUpdate((model, message) =>
  Message.match(message, {
    RequestedSetCount: ({ count }) => ({
      model: Struct.modifyFields(model, { count: () => count }),
      commands: [SaveCount({ count })],
    }),
    CompletedSaveCount: () => ({ model }),
    CompletedObservePanel: () => ({ model }),
  }),
)

export const view = CountComposition.makeView.withInputs<
  typeof ViewInputs.Type
>((model, { label }, h) =>
  h.div(
    [h.OnMount(ObservePanel())],
    [`${label}: ${globalThis.String(model.count)}`],
  ),
)

export const EffectsLayer = Layer.merge(SaveCount.layer, ObservePanel.layer)

export const assembleViewed = () =>
  CountComposition.assembleBlock({
    init,
    update,
    view,
    operations: { setCount: Message.RequestedSetCount },
    EffectsLayer,
  })

export const assembleHeadless = () =>
  CountComposition.assembleBlock({
    init,
    update,
    operations: { setCount: Message.RequestedSetCount },
    EffectsLayer,
  })

const ReportingComposition = ReportingCountDefinition.makeComposition()
const reportingInit = ReportingComposition.makeInit(() => ({
  model: Model.make({ count: 0 }),
}))
const reportingUpdate = ReportingComposition.makeUpdate((model, message) =>
  Message.match(message, {
    RequestedSetCount: ({ count }) => ({
      model: Struct.modifyFields(model, { count: () => count }),
      outMessage: OutMessage.ChangedCount({ count }),
    }),
    CompletedSaveCount: () => ({ model }),
    CompletedObservePanel: () => ({ model }),
  }),
)
const reportingView = ReportingComposition.makeView((model, h) =>
  h.div([], [globalThis.String(model.count)]),
)

export const assembleReportingViewed = () =>
  ReportingComposition.assembleBlock({
    init: reportingInit,
    update: reportingUpdate,
    view: reportingView,
    operations: { setCount: Message.RequestedSetCount },
  })

export const assembleReportingHeadless = () =>
  ReportingComposition.assembleBlock({
    init: reportingInit,
    update: reportingUpdate,
    operations: { setCount: Message.RequestedSetCount },
  })

export declare const assembleErased: () => never

export const OriginalViewed = assembleViewed()
export const Viewed: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleViewed
> = assembleViewed()

export const OriginalHeadless = assembleHeadless()
export const Headless: Block.FromAssemblyWithoutViewOrOutMessage<
  typeof Model,
  typeof assembleHeadless
> = assembleHeadless()

export const OriginalReportingViewed = assembleReportingViewed()
export const ReportingViewed: Block.FromAssemblyWithViewAndOutMessage<
  typeof Model,
  typeof assembleReportingViewed
> = assembleReportingViewed()

export const OriginalReportingHeadless = assembleReportingHeadless()
export const ReportingHeadless: Block.FromAssemblyWithOutMessage<
  typeof Model,
  typeof assembleReportingHeadless
> = assembleReportingHeadless()

export const RawParentDefinition = Block.makeDefinition(
  'FromAssemblyRawParent',
  {
    Model: Schema.Struct({ child: OriginalViewed.Model }),
    Message: Schema.Never,
  },
)
export const RawParentBinding = RawParentDefinition.makeBinding(
  OriginalViewed,
  {
    field: 'child',
  },
)
export const RawParentComposition = RawParentDefinition.makeComposition({
  bindings: [RawParentBinding],
})

const assembleRawParent = () =>
  RawParentComposition.assembleBlock({
    init: RawParentComposition.makeInit(() => ({ model: {} })),
    update: RawParentComposition.makeUpdate(),
    view: RawParentComposition.makeView((model, h) =>
      h.block(
        RawParentBinding.embedView({
          slotId: 'child',
          model: model.child,
          viewInputs: { label: 'Count' },
        }),
      ),
    ),
  })

export const RawParent = assembleRawParent()

export const ParentDefinition = Block.makeDefinition('FromAssemblyParent', {
  Model: Schema.Struct({ child: Viewed.Model }),
  Message: Schema.Never,
})
export const ParentBinding = ParentDefinition.makeBinding(Viewed, {
  field: 'child',
})
export const HeadlessBinding = ParentDefinition.makeBinding(Headless, {
  field: 'child',
})
export const ParentComposition = ParentDefinition.makeComposition({
  bindings: [ParentBinding],
})

const assembleParent = () =>
  ParentComposition.assembleBlock({
    init: ParentComposition.makeInit(() => ({ model: {} })),
    update: ParentComposition.makeUpdate(),
    view: ParentComposition.makeView((model, h) =>
      h.block(
        ParentBinding.embedView({
          slotId: 'child',
          model: model.child,
          viewInputs: { label: 'Count' },
        }),
      ),
    ),
  })

export const OriginalParent = assembleParent()
export const Parent: Block.FromAssemblyWithView<
  typeof ParentDefinition.Model,
  typeof assembleParent
> = assembleParent()

export const OriginalErased = assembleErased()
export const ErasedAnnotation: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleErased
> = assembleErased()

declare const bottomProducer: never
export declare const BottomAnnotation: Block.FromAssemblyWithView<
  typeof Model,
  typeof bottomProducer
>
