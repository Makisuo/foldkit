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
const Leaf = TypePerformanceDeepLeaf.toComposition().toBlock({
  init: () => ({ model: LeafModel.make({ value: 0 }) }),
  update: TypePerformanceDeepLeaf.update((model, message) =>
    LeafMessage.match(message, {
      RequestedRun: () => runLeaf(model),
      CompletedRun: () => ({ model }),
    }),
  ),
  expose: { runLeaf },
  EffectsLayer: RunLeaf.layer,
})

const TypePerformanceLevel001 = Block.define('TypePerformanceLevel001', {
  Model: LeafModel,
  Message: LeafMessage,
})
const child001 = TypePerformanceLevel001.bindChild(Leaf, {
  placement: 'child001',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  toParentMessage: message => message,
})
const TypePerformanceLevel001Composition =
  TypePerformanceLevel001.toComposition({ children: [child001] })
const Level001 = TypePerformanceLevel001Composition.toBlock({
  init: () => child001.init(),
  update: TypePerformanceLevel001.update((model, message) =>
    child001.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel002 = Block.define('TypePerformanceLevel002', {
  Model: LeafModel,
  Message: LeafMessage,
})
const child002 = TypePerformanceLevel002.bindChild(Level001, {
  placement: 'child002',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  toParentMessage: message => message,
})
const TypePerformanceLevel002Composition =
  TypePerformanceLevel002.toComposition({ children: [child002] })
const Level002 = TypePerformanceLevel002Composition.toBlock({
  init: () => child002.init(),
  update: TypePerformanceLevel002.update((model, message) =>
    child002.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel003 = Block.define('TypePerformanceLevel003', {
  Model: LeafModel,
  Message: LeafMessage,
})
const child003 = TypePerformanceLevel003.bindChild(Level002, {
  placement: 'child003',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  toParentMessage: message => message,
})
const TypePerformanceLevel003Composition =
  TypePerformanceLevel003.toComposition({ children: [child003] })
const Level003 = TypePerformanceLevel003Composition.toBlock({
  init: () => child003.init(),
  update: TypePerformanceLevel003.update((model, message) =>
    child003.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel004 = Block.define('TypePerformanceLevel004', {
  Model: LeafModel,
  Message: LeafMessage,
})
const child004 = TypePerformanceLevel004.bindChild(Level003, {
  placement: 'child004',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  toParentMessage: message => message,
})
const TypePerformanceLevel004Composition =
  TypePerformanceLevel004.toComposition({ children: [child004] })
const Level004 = TypePerformanceLevel004Composition.toBlock({
  init: () => child004.init(),
  update: TypePerformanceLevel004.update((model, message) =>
    child004.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel005 = Block.define('TypePerformanceLevel005', {
  Model: LeafModel,
  Message: LeafMessage,
})
const child005 = TypePerformanceLevel005.bindChild(Level004, {
  placement: 'child005',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  toParentMessage: message => message,
})
const TypePerformanceLevel005Composition =
  TypePerformanceLevel005.toComposition({ children: [child005] })
const Level005 = TypePerformanceLevel005Composition.toBlock({
  init: () => child005.init(),
  update: TypePerformanceLevel005.update((model, message) =>
    child005.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel006 = Block.define('TypePerformanceLevel006', {
  Model: LeafModel,
  Message: LeafMessage,
})
const child006 = TypePerformanceLevel006.bindChild(Level005, {
  placement: 'child006',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  toParentMessage: message => message,
})
const TypePerformanceLevel006Composition =
  TypePerformanceLevel006.toComposition({ children: [child006] })
const Level006 = TypePerformanceLevel006Composition.toBlock({
  init: () => child006.init(),
  update: TypePerformanceLevel006.update((model, message) =>
    child006.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel007 = Block.define('TypePerformanceLevel007', {
  Model: LeafModel,
  Message: LeafMessage,
})
const child007 = TypePerformanceLevel007.bindChild(Level006, {
  placement: 'child007',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  toParentMessage: message => message,
})
const TypePerformanceLevel007Composition =
  TypePerformanceLevel007.toComposition({ children: [child007] })
const Level007 = TypePerformanceLevel007Composition.toBlock({
  init: () => child007.init(),
  update: TypePerformanceLevel007.update((model, message) =>
    child007.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const TypePerformanceLevel008 = Block.define('TypePerformanceLevel008', {
  Model: LeafModel,
  Message: LeafMessage,
})
const child008 = TypePerformanceLevel008.bindChild(Level007, {
  placement: 'child008',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  toParentMessage: message => message,
})
const TypePerformanceLevel008Composition =
  TypePerformanceLevel008.toComposition({ children: [child008] })
const Level008 = TypePerformanceLevel008Composition.toBlock({
  init: () => child008.init(),
  update: TypePerformanceLevel008.update((model, message) =>
    child008.fold(model, message),
  ),
  EffectsLayer: Layer.empty,
})

const Application = defineApplication({
  Model: LeafModel,
  Message: LeafMessage,
})
const child008Root = Application.bindChild(Level008, {
  placement: 'child008Root',
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  toParentMessage: message => message,
})
const ApplicationComposition = Application.toComposition({
  children: [child008Root],
})
const update = ApplicationComposition.update((model, message) =>
  child008Root.fold(model, message),
)
const view = ApplicationComposition.view((_model, h) => h.main([]))

export const program = ApplicationComposition.toElement({
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
