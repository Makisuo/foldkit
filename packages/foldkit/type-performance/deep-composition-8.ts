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

const TypePerformanceDeepLeaf = Block.define('TypePerformanceDeepLeaf', {
  Model: LeafModel,
  Message: LeafMessage,
})
const RunLeaf = TypePerformanceDeepLeaf.command('RunLeaf', {
  messages: [LeafMessage.CompletedRun],
  handler: function* () {
    const clock = yield* Clock

    return () => clock.run.pipe(Effect.as(LeafMessage.CompletedRun()))
  },
})
const runLeaf = TypePerformanceDeepLeaf.step(model => ({
  model,
  commands: [RunLeaf()],
}))
const Leaf = TypePerformanceDeepLeaf.assemble({
  init: () => ({ model: LeafModel.make({ value: 0 }) }),
  update: TypePerformanceDeepLeaf.update((model, message) =>
    LeafMessage.match(message, {
      RequestedRun: () => runLeaf(model),
      CompletedRun: () => ({ model }),
    }),
  ),
  steps: { runLeaf },
  EffectsLayer: RunLeaf.layer,
})

const child001 = Leaf.connection({
  placement: 'child001',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel001 = Block.define('TypePerformanceLevel001', {
  Model: LeafModel,
  Message: LeafMessage,
}).register({ children: [child001] })
const Level001 = TypePerformanceLevel001.assemble({
  init: () => child001.init(),
  update: TypePerformanceLevel001.update((model, message) =>
    child001.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const child002 = Level001.connection({
  placement: 'child002',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel002 = Block.define('TypePerformanceLevel002', {
  Model: LeafModel,
  Message: LeafMessage,
}).register({ children: [child002] })
const Level002 = TypePerformanceLevel002.assemble({
  init: () => child002.init(),
  update: TypePerformanceLevel002.update((model, message) =>
    child002.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const child003 = Level002.connection({
  placement: 'child003',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel003 = Block.define('TypePerformanceLevel003', {
  Model: LeafModel,
  Message: LeafMessage,
}).register({ children: [child003] })
const Level003 = TypePerformanceLevel003.assemble({
  init: () => child003.init(),
  update: TypePerformanceLevel003.update((model, message) =>
    child003.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const child004 = Level003.connection({
  placement: 'child004',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel004 = Block.define('TypePerformanceLevel004', {
  Model: LeafModel,
  Message: LeafMessage,
}).register({ children: [child004] })
const Level004 = TypePerformanceLevel004.assemble({
  init: () => child004.init(),
  update: TypePerformanceLevel004.update((model, message) =>
    child004.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const child005 = Level004.connection({
  placement: 'child005',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel005 = Block.define('TypePerformanceLevel005', {
  Model: LeafModel,
  Message: LeafMessage,
}).register({ children: [child005] })
const Level005 = TypePerformanceLevel005.assemble({
  init: () => child005.init(),
  update: TypePerformanceLevel005.update((model, message) =>
    child005.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const child006 = Level005.connection({
  placement: 'child006',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel006 = Block.define('TypePerformanceLevel006', {
  Model: LeafModel,
  Message: LeafMessage,
}).register({ children: [child006] })
const Level006 = TypePerformanceLevel006.assemble({
  init: () => child006.init(),
  update: TypePerformanceLevel006.update((model, message) =>
    child006.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const child007 = Level006.connection({
  placement: 'child007',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel007 = Block.define('TypePerformanceLevel007', {
  Model: LeafModel,
  Message: LeafMessage,
}).register({ children: [child007] })
const Level007 = TypePerformanceLevel007.assemble({
  init: () => child007.init(),
  update: TypePerformanceLevel007.update((model, message) =>
    child007.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const child008 = Level007.connection({
  placement: 'child008',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const TypePerformanceLevel008 = Block.define('TypePerformanceLevel008', {
  Model: LeafModel,
  Message: LeafMessage,
}).register({ children: [child008] })
const Level008 = TypePerformanceLevel008.assemble({
  init: () => child008.init(),
  update: TypePerformanceLevel008.update((model, message) =>
    child008.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const child008Root = Level008.connection({
  placement: 'child008Root',
  read: (model: LeafModel) => Option.some(model),
  write: (_model: LeafModel, nextChild: LeafModel) => nextChild,
  toParentMessage: (message: LeafMessage) => message,
})
const Application = defineApplication({
  Model: LeafModel,
  Message: LeafMessage,
}).register({ children: [child008Root] })
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
