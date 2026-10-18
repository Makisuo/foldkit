import { Context, Effect, Layer, Option, Schema } from 'effect'
import { defineApplication } from 'foldkit'
import type { Element as ElementProgram } from 'foldkit/application'
import * as Block from 'foldkit/block'
import { defineMessageUnion } from 'foldkit/message'
import type * as Update from 'foldkit/update'

const WarmupModel = Schema.Struct({ value: Schema.Number })
const WarmupMessage = defineMessageUnion({ CompletedWarmup: {} })

// oxlint-disable-next-line effecttsgo/floating-effect
Effect.void
Layer.empty
Option.none()
defineApplication({ Model: WarmupModel, Message: WarmupMessage })
Context.Service
Block.define('TypePerformanceWarmup', {
  Model: WarmupModel,
  Message: WarmupMessage,
})

export type WarmupStep = Update.Step<
  typeof WarmupModel.Type,
  typeof WarmupMessage.Type
>
export type WarmupElement = ElementProgram

const LeafModel = Schema.Struct({ value: Schema.Number })
type LeafModel = typeof LeafModel.Type

const LeafMessage = defineMessageUnion({ RequestedRun: {}, CompletedRun: {} })
type LeafMessage = typeof LeafMessage.Type

class Clock extends Context.Service<
  Clock,
  Readonly<{ run: Effect.Effect<void> }>
>()('TypePerformanceDeepLeafClock') {}
const ClockLayer = Layer.succeed(Clock, { run: Effect.void })

const TypePerformanceDeepLeafDefinition = Block.define(
  'TypePerformanceDeepLeaf',
  {
    Model: LeafModel,
    Message: LeafMessage,
  },
)
const RunLeaf = TypePerformanceDeepLeafDefinition.command('RunLeaf', {
  messages: [LeafMessage.CompletedRun],
  handler: function* () {
    const clock = yield* Clock

    return () => clock.run.pipe(Effect.as(LeafMessage.CompletedRun()))
  },
})
const runLeaf = TypePerformanceDeepLeafDefinition.step(model => ({
  model,
  commands: [RunLeaf()],
}))
const TypePerformanceDeepLeafComposition =
  TypePerformanceDeepLeafDefinition.makeComposition()
const Leaf = TypePerformanceDeepLeafComposition.makeBlock({
  init: TypePerformanceDeepLeafComposition.makeInit(() => ({
    model: LeafModel.make({ value: 0 }),
  })),
  update: TypePerformanceDeepLeafComposition.makeUpdate((model, message) =>
    LeafMessage.match(message, {
      RequestedRun: () => runLeaf(model),
      CompletedRun: () => ({ model }),
    }),
  ),
  operations: {
    runLeaf: LeafMessage.RequestedRun,
  },
  EffectsLayer: RunLeaf.layer,
})

const Level001Message = defineMessageUnion({
  GotChildMessage: { message: Leaf.Message },
})
const TypePerformanceLevel001Definition = Block.define(
  'TypePerformanceLevel001',
  {
    Model: LeafModel,
    Message: Level001Message,
  },
)
const Child001Binding = TypePerformanceLevel001Definition.bindChild(Leaf, {
  placement: 'child001',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  parentMessage: Level001Message.GotChildMessage,
  fromParentMessage: { args: (_model, { message }) => Option.some([message]) },
})
const TypePerformanceLevel001Composition =
  TypePerformanceLevel001Definition.makeComposition({
    childBindings: [Child001Binding],
  })
const Level001 = TypePerformanceLevel001Composition.makeBlock({
  init: TypePerformanceLevel001Composition.makeInit(() =>
    Child001Binding.init({ args: [], toParentModel: model => model }),
  ),
  update: TypePerformanceLevel001Composition.makeUpdate(),
  EffectsLayer: Layer.empty,
})

const Level002Message = defineMessageUnion({
  GotChildMessage: { message: Level001.Message },
})
const TypePerformanceLevel002Definition = Block.define(
  'TypePerformanceLevel002',
  {
    Model: LeafModel,
    Message: Level002Message,
  },
)
const Child002Binding = TypePerformanceLevel002Definition.bindChild(Level001, {
  placement: 'child002',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  parentMessage: Level002Message.GotChildMessage,
  fromParentMessage: { args: (_model, { message }) => Option.some([message]) },
})
const TypePerformanceLevel002Composition =
  TypePerformanceLevel002Definition.makeComposition({
    childBindings: [Child002Binding],
  })
const Level002 = TypePerformanceLevel002Composition.makeBlock({
  init: TypePerformanceLevel002Composition.makeInit(() =>
    Child002Binding.init({ args: [], toParentModel: model => model }),
  ),
  update: TypePerformanceLevel002Composition.makeUpdate(),
  EffectsLayer: Layer.empty,
})

const Level003Message = defineMessageUnion({
  GotChildMessage: { message: Level002.Message },
})
const TypePerformanceLevel003Definition = Block.define(
  'TypePerformanceLevel003',
  {
    Model: LeafModel,
    Message: Level003Message,
  },
)
const Child003Binding = TypePerformanceLevel003Definition.bindChild(Level002, {
  placement: 'child003',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  parentMessage: Level003Message.GotChildMessage,
  fromParentMessage: { args: (_model, { message }) => Option.some([message]) },
})
const TypePerformanceLevel003Composition =
  TypePerformanceLevel003Definition.makeComposition({
    childBindings: [Child003Binding],
  })
const Level003 = TypePerformanceLevel003Composition.makeBlock({
  init: TypePerformanceLevel003Composition.makeInit(() =>
    Child003Binding.init({ args: [], toParentModel: model => model }),
  ),
  update: TypePerformanceLevel003Composition.makeUpdate(),
  EffectsLayer: Layer.empty,
})

const Level004Message = defineMessageUnion({
  GotChildMessage: { message: Level003.Message },
})
const TypePerformanceLevel004Definition = Block.define(
  'TypePerformanceLevel004',
  {
    Model: LeafModel,
    Message: Level004Message,
  },
)
const Child004Binding = TypePerformanceLevel004Definition.bindChild(Level003, {
  placement: 'child004',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  parentMessage: Level004Message.GotChildMessage,
  fromParentMessage: { args: (_model, { message }) => Option.some([message]) },
})
const TypePerformanceLevel004Composition =
  TypePerformanceLevel004Definition.makeComposition({
    childBindings: [Child004Binding],
  })
const Level004 = TypePerformanceLevel004Composition.makeBlock({
  init: TypePerformanceLevel004Composition.makeInit(() =>
    Child004Binding.init({ args: [], toParentModel: model => model }),
  ),
  update: TypePerformanceLevel004Composition.makeUpdate(),
  EffectsLayer: Layer.empty,
})

const Level005Message = defineMessageUnion({
  GotChildMessage: { message: Level004.Message },
})
const TypePerformanceLevel005Definition = Block.define(
  'TypePerformanceLevel005',
  {
    Model: LeafModel,
    Message: Level005Message,
  },
)
const Child005Binding = TypePerformanceLevel005Definition.bindChild(Level004, {
  placement: 'child005',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  parentMessage: Level005Message.GotChildMessage,
  fromParentMessage: { args: (_model, { message }) => Option.some([message]) },
})
const TypePerformanceLevel005Composition =
  TypePerformanceLevel005Definition.makeComposition({
    childBindings: [Child005Binding],
  })
const Level005 = TypePerformanceLevel005Composition.makeBlock({
  init: TypePerformanceLevel005Composition.makeInit(() =>
    Child005Binding.init({ args: [], toParentModel: model => model }),
  ),
  update: TypePerformanceLevel005Composition.makeUpdate(),
  EffectsLayer: Layer.empty,
})

const Level006Message = defineMessageUnion({
  GotChildMessage: { message: Level005.Message },
})
const TypePerformanceLevel006Definition = Block.define(
  'TypePerformanceLevel006',
  {
    Model: LeafModel,
    Message: Level006Message,
  },
)
const Child006Binding = TypePerformanceLevel006Definition.bindChild(Level005, {
  placement: 'child006',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  parentMessage: Level006Message.GotChildMessage,
  fromParentMessage: { args: (_model, { message }) => Option.some([message]) },
})
const TypePerformanceLevel006Composition =
  TypePerformanceLevel006Definition.makeComposition({
    childBindings: [Child006Binding],
  })
const Level006 = TypePerformanceLevel006Composition.makeBlock({
  init: TypePerformanceLevel006Composition.makeInit(() =>
    Child006Binding.init({ args: [], toParentModel: model => model }),
  ),
  update: TypePerformanceLevel006Composition.makeUpdate(),
  EffectsLayer: Layer.empty,
})

const Level007Message = defineMessageUnion({
  GotChildMessage: { message: Level006.Message },
})
const TypePerformanceLevel007Definition = Block.define(
  'TypePerformanceLevel007',
  {
    Model: LeafModel,
    Message: Level007Message,
  },
)
const Child007Binding = TypePerformanceLevel007Definition.bindChild(Level006, {
  placement: 'child007',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  parentMessage: Level007Message.GotChildMessage,
  fromParentMessage: { args: (_model, { message }) => Option.some([message]) },
})
const TypePerformanceLevel007Composition =
  TypePerformanceLevel007Definition.makeComposition({
    childBindings: [Child007Binding],
  })
const Level007 = TypePerformanceLevel007Composition.makeBlock({
  init: TypePerformanceLevel007Composition.makeInit(() =>
    Child007Binding.init({ args: [], toParentModel: model => model }),
  ),
  update: TypePerformanceLevel007Composition.makeUpdate(),
  EffectsLayer: Layer.empty,
})

const Level008Message = defineMessageUnion({
  GotChildMessage: { message: Level007.Message },
})
const TypePerformanceLevel008Definition = Block.define(
  'TypePerformanceLevel008',
  {
    Model: LeafModel,
    Message: Level008Message,
  },
)
const Child008Binding = TypePerformanceLevel008Definition.bindChild(Level007, {
  placement: 'child008',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  parentMessage: Level008Message.GotChildMessage,
  fromParentMessage: { args: (_model, { message }) => Option.some([message]) },
})
const TypePerformanceLevel008Composition =
  TypePerformanceLevel008Definition.makeComposition({
    childBindings: [Child008Binding],
  })
const Level008 = TypePerformanceLevel008Composition.makeBlock({
  init: TypePerformanceLevel008Composition.makeInit(() =>
    Child008Binding.init({ args: [], toParentModel: model => model }),
  ),
  update: TypePerformanceLevel008Composition.makeUpdate(),
  EffectsLayer: Layer.empty,
})

const ApplicationMessage = defineMessageUnion({
  GotChildMessage: { message: Level008.Message },
})
const ApplicationDefinition = defineApplication({
  Model: LeafModel,
  Message: ApplicationMessage,
})
const Child008RootBinding = ApplicationDefinition.bindChild(Level008, {
  placement: 'child008Root',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  parentMessage: ApplicationMessage.GotChildMessage,
  fromParentMessage: { args: (_model, { message }) => Option.some([message]) },
})
const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [Child008RootBinding],
})
const update = ApplicationComposition.makeUpdate()
const view = ApplicationComposition.makeView((_model, h) => h.main([]))

export const program = ApplicationComposition.makeElement({
  container: null,
  init: ApplicationComposition.makeInit(() =>
    Child008RootBinding.init({ args: [], toParentModel: model => model }),
  ),
  update,
  view,
  EffectsLayer: Layer.empty,
})
export const providedProgram = program.provide(ClockLayer)

export type ApplicationRequirements = Update.RequirementsOf<typeof update>
export type Program = typeof program
type RequirementsOf<Value> =
  Value extends ElementProgram<
    undefined,
    infer Requirements,
    never,
    infer _ProvidedServices
  >
    ? Requirements
    : never
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value
type ProgramRequirementsAreClock = Expect<
  Equal<RequirementsOf<typeof program>, Clock>
>
type ProvidedRequirementsAreComplete = Expect<
  Equal<RequirementsOf<typeof providedProgram>, never>
>
export type Assertions = [
  ProgramRequirementsAreClock,
  ProvidedRequirementsAreComplete,
]
