import { Context, Effect, Layer, Option, Schema } from 'effect'
import {
  type Element as ElementProgram,
  define as defineApplication,
} from 'foldkit/application'
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
const Leaf = TypePerformanceDeepLeafDefinition.toComposition().toBlock({
  init: () => ({ model: LeafModel.make({ value: 0 }) }),
  update: TypePerformanceDeepLeafDefinition.update((model, message) =>
    LeafMessage.match(message, {
      RequestedRun: () => runLeaf(model),
      CompletedRun: () => ({ model }),
    }),
  ),
  expose: { runLeaf },
  EffectsLayer: RunLeaf.layer,
})

const TypePerformanceLevel001Definition = Block.define(
  'TypePerformanceLevel001',
  {
    Model: LeafModel,
    Message: LeafMessage,
  },
)
const child001 = TypePerformanceLevel001Definition.bindChild(Leaf, {
  placement: 'child001',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel001Composition =
  TypePerformanceLevel001Definition.toComposition({ children: [child001] })
const Level001 = TypePerformanceLevel001Composition.toBlock({
  init: () => child001.init(),
  update: TypePerformanceLevel001Definition.update((model, message) =>
    child001.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel002Definition = Block.define(
  'TypePerformanceLevel002',
  {
    Model: LeafModel,
    Message: LeafMessage,
  },
)
const child002 = TypePerformanceLevel002Definition.bindChild(Level001, {
  placement: 'child002',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel002Composition =
  TypePerformanceLevel002Definition.toComposition({ children: [child002] })
const Level002 = TypePerformanceLevel002Composition.toBlock({
  init: () => child002.init(),
  update: TypePerformanceLevel002Definition.update((model, message) =>
    child002.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel003Definition = Block.define(
  'TypePerformanceLevel003',
  {
    Model: LeafModel,
    Message: LeafMessage,
  },
)
const child003 = TypePerformanceLevel003Definition.bindChild(Level002, {
  placement: 'child003',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel003Composition =
  TypePerformanceLevel003Definition.toComposition({ children: [child003] })
const Level003 = TypePerformanceLevel003Composition.toBlock({
  init: () => child003.init(),
  update: TypePerformanceLevel003Definition.update((model, message) =>
    child003.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel004Definition = Block.define(
  'TypePerformanceLevel004',
  {
    Model: LeafModel,
    Message: LeafMessage,
  },
)
const child004 = TypePerformanceLevel004Definition.bindChild(Level003, {
  placement: 'child004',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel004Composition =
  TypePerformanceLevel004Definition.toComposition({ children: [child004] })
const Level004 = TypePerformanceLevel004Composition.toBlock({
  init: () => child004.init(),
  update: TypePerformanceLevel004Definition.update((model, message) =>
    child004.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel005Definition = Block.define(
  'TypePerformanceLevel005',
  {
    Model: LeafModel,
    Message: LeafMessage,
  },
)
const child005 = TypePerformanceLevel005Definition.bindChild(Level004, {
  placement: 'child005',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel005Composition =
  TypePerformanceLevel005Definition.toComposition({ children: [child005] })
const Level005 = TypePerformanceLevel005Composition.toBlock({
  init: () => child005.init(),
  update: TypePerformanceLevel005Definition.update((model, message) =>
    child005.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel006Definition = Block.define(
  'TypePerformanceLevel006',
  {
    Model: LeafModel,
    Message: LeafMessage,
  },
)
const child006 = TypePerformanceLevel006Definition.bindChild(Level005, {
  placement: 'child006',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel006Composition =
  TypePerformanceLevel006Definition.toComposition({ children: [child006] })
const Level006 = TypePerformanceLevel006Composition.toBlock({
  init: () => child006.init(),
  update: TypePerformanceLevel006Definition.update((model, message) =>
    child006.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel007Definition = Block.define(
  'TypePerformanceLevel007',
  {
    Model: LeafModel,
    Message: LeafMessage,
  },
)
const child007 = TypePerformanceLevel007Definition.bindChild(Level006, {
  placement: 'child007',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel007Composition =
  TypePerformanceLevel007Definition.toComposition({ children: [child007] })
const Level007 = TypePerformanceLevel007Composition.toBlock({
  init: () => child007.init(),
  update: TypePerformanceLevel007Definition.update((model, message) =>
    child007.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel008Definition = Block.define(
  'TypePerformanceLevel008',
  {
    Model: LeafModel,
    Message: LeafMessage,
  },
)
const child008 = TypePerformanceLevel008Definition.bindChild(Level007, {
  placement: 'child008',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel008Composition =
  TypePerformanceLevel008Definition.toComposition({ children: [child008] })
const Level008 = TypePerformanceLevel008Composition.toBlock({
  init: () => child008.init(),
  update: TypePerformanceLevel008Definition.update((model, message) =>
    child008.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const ApplicationDefinition = defineApplication({
  Model: LeafModel,
  Message: LeafMessage,
})
const child008Root = ApplicationDefinition.bindChild(Level008, {
  placement: 'child008Root',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const Application = ApplicationDefinition.toComposition({
  children: [child008Root],
})
const update = Application.update((model, message) =>
  child008Root.fold(model, message),
)
const view = Application.view((_model, h) => h.main([]))

export const program = Application.makeElement({
  container: null,
  init: () => child008Root.init(),
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
