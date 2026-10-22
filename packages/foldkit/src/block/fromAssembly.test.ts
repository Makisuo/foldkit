import { Effect, Schema } from 'effect'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import * as Program from '../runtime/programPublic.js'
import { makeDefinition } from './define.js'
import type { AnyBlock } from './definition.js'
import type {
  AssemblyWithView,
  FromAssemblyWithOutMessage,
  FromAssemblyWithView,
  FromAssemblyWithViewAndOutMessage,
  FromAssemblyWithoutViewOrOutMessage,
} from './fromAssembly.js'

const Model = Schema.Struct({ count: Schema.Number })
const Message = defineMessageUnion({ CompletedObserve: {} })
const OutMessage = defineMessageUnion({
  ReportedCount: { count: Schema.Number },
})
const Definition = makeDefinition('FromAssemblyRuntime', { Model, Message })
const ReportingDefinition = makeDefinition('FromAssemblyReportingRuntime', {
  Model,
  Message,
  OutMessage,
})
const constructed: Array<string> = []
const Observe = Definition.makeCommand('Observe', {
  messages: [Message.CompletedObserve],
  handler: function* () {
    constructed.push('Observe')

    return () => Effect.succeed(Message.CompletedObserve())
  },
})
const Composition = Definition.makeComposition()
const ReportingComposition = ReportingDefinition.makeComposition()
const init = Composition.makeInit(() => ({
  model: Model.make({ count: 0 }),
  commands: [Observe()],
}))
const update = Composition.makeUpdate(model => ({ model }))
const view = Composition.makeView((model, h) =>
  h.div([], [globalThis.String(model.count)]),
)
const reportingInit = ReportingComposition.makeInit(() => ({
  model: Model.make({ count: 0 }),
}))
const reportingUpdate = ReportingComposition.makeUpdate(model => ({
  model,
  outMessage: OutMessage.ReportedCount({ count: model.count }),
}))
const reportingView = ReportingComposition.makeView((model, h) =>
  h.div([], [globalThis.String(model.count)]),
)

const assembleViewed = () =>
  Composition.assembleBlock({ init, update, view, EffectsLayer: Observe.layer })
const assembleHeadless = () =>
  Composition.assembleBlock({ init, update, EffectsLayer: Observe.layer })
const assembleReportingViewed = () =>
  ReportingComposition.assembleBlock({
    init: reportingInit,
    update: reportingUpdate,
    view: reportingView,
  })
const assembleReportingHeadless = () =>
  ReportingComposition.assembleBlock({
    init: reportingInit,
    update: reportingUpdate,
  })

const Viewed: FromAssemblyWithView<typeof Model, typeof assembleViewed> =
  assembleViewed()
const Headless: FromAssemblyWithoutViewOrOutMessage<
  typeof Model,
  typeof assembleHeadless
> = assembleHeadless()
const ReportingViewed: FromAssemblyWithViewAndOutMessage<
  typeof Model,
  typeof assembleReportingViewed
> = assembleReportingViewed()
const ReportingHeadless: FromAssemblyWithOutMessage<
  typeof Model,
  typeof assembleReportingHeadless
> = assembleReportingHeadless()

describe('Assembly annotations', () => {
  it('retains the original Model Schema for every view and OutMessage shape', () => {
    for (const block of [
      Viewed,
      Headless,
      ReportingViewed,
      ReportingHeadless,
    ]) {
      expect(block.Model).toBe(Model)
    }

    expectTypeOf<typeof Viewed.Model>().toEqualTypeOf<typeof Model>()
    expectTypeOf<typeof Headless.Model>().toEqualTypeOf<typeof Model>()
    expectTypeOf<typeof ReportingViewed.Model>().toEqualTypeOf<typeof Model>()
    expectTypeOf<typeof ReportingHeadless.Model>().toEqualTypeOf<typeof Model>()
    expectTypeOf(Viewed).toMatchTypeOf<ReturnType<typeof assembleViewed>>()
    expectTypeOf(assembleViewed()).toMatchTypeOf<typeof Viewed>()
    expectTypeOf(Headless).toMatchTypeOf<ReturnType<typeof assembleHeadless>>()
    expectTypeOf(assembleHeadless()).toMatchTypeOf<typeof Headless>()
    expectTypeOf(ReportingViewed).toMatchTypeOf<
      ReturnType<typeof assembleReportingViewed>
    >()
    expectTypeOf(assembleReportingViewed()).toMatchTypeOf<
      typeof ReportingViewed
    >()
    expectTypeOf(ReportingHeadless).toMatchTypeOf<
      ReturnType<typeof assembleReportingHeadless>
    >()
    expectTypeOf(assembleReportingHeadless()).toMatchTypeOf<
      typeof ReportingHeadless
    >()
  })

  it('retains member identity and keeps handler recipes passive', () => {
    expect(Viewed.init).toBe(init)
    expect(Viewed.update).toBe(update)
    expect(ReportingViewed.OutMessage).toBe(OutMessage)
    expect(ReportingHeadless.OutMessage).toBe(OutMessage)
    expect(constructed).toEqual([])
  })

  it('allows an extension after the exact assembly has been annotated', () => {
    const plain: FromAssemblyWithView<typeof Model, typeof assembleViewed> =
      assembleViewed()
    const extended = Object.assign(plain, { test: { drain: () => 1 } })

    expect(extended.Model).toBe(Model)
    expect(extended.test.drain()).toBe(1)
  })
})

declare const anyProducer: any
declare const neverProducer: () => never
declare const unknownProducer: () => unknown
declare function overloadedProducer(): any
declare function overloadedProducer(): never
declare function overloadedProducer(): ReturnType<typeof assembleViewed>

if (false) {
  // @ts-expect-error A headless assembly cannot acquire a default view from its annotation.
  const inventedView: FromAssemblyWithView<
    typeof Model,
    typeof assembleHeadless
  > = assembleHeadless()
  // @ts-expect-error An OutMessage Schema cannot disappear from a viewed assembly.
  const erasedOutMessage: FromAssemblyWithView<
    typeof Model,
    typeof assembleReportingViewed
  > = assembleReportingViewed()
  // @ts-expect-error A plain assembly cannot acquire an OutMessage Schema from its annotation.
  const inventedOutMessage: FromAssemblyWithOutMessage<
    typeof Model,
    typeof assembleHeadless
  > = assembleHeadless()
  // @ts-expect-error A default view cannot disappear from a reporting assembly.
  const erasedView: FromAssemblyWithOutMessage<
    typeof Model,
    typeof assembleReportingViewed
  > = assembleReportingViewed()

  // @ts-expect-error A whole-any producer cannot initialize the checked alias.
  const anyBlock: FromAssemblyWithView<typeof Model, typeof anyProducer> =
    anyProducer()
  // @ts-expect-error An unknown result cannot establish a complete assembly.
  const unknownBlock: FromAssemblyWithView<
    typeof Model,
    // @ts-expect-error An unknown return cannot satisfy the complete-producer constraint.
    typeof unknownProducer
  > = unknownProducer()
  const overloadedBlock: FromAssemblyWithView<
    typeof Model,
    // @ts-expect-error A never middle overload cannot hide an any-returning selected signature.
    typeof overloadedProducer
  > = overloadedProducer()
  const overloadedCarrier: AssemblyWithView<
    typeof Model,
    // @ts-expect-error The public support interface keeps the same overload guard.
    typeof overloadedProducer
  > = overloadedProducer()
  const erasedBlock: FromAssemblyWithView<typeof Model, typeof neverProducer> =
    neverProducer()
  const erasedCarrier: AssemblyWithView<typeof Model, typeof anyProducer> =
    anyProducer()
  // @ts-expect-error Never results have unusable required members.
  const neverAsBlock: AnyBlock = erasedBlock
  // @ts-expect-error Public support interfaces cannot launder any into a usable Block.
  const anyAsBlock: AnyBlock = erasedCarrier
  // @ts-expect-error An erased carrier cannot complete a Program.
  Program.makeElement({ block: erasedCarrier, container: null })
  const BroadModel: Schema.Codec<
    { count: number | string },
    { count: number | string }
  > = Model
  const broadBlock: FromAssemblyWithView<
    typeof BroadModel,
    // @ts-expect-error Assignability to a broader mutable Schema is not exact header agreement.
    typeof assembleViewed
  > = assembleViewed()
  const broadCarrier: AssemblyWithView<
    typeof BroadModel,
    // @ts-expect-error The public support interface also checks exact Schema agreement.
    typeof assembleViewed
  > = assembleViewed()

  void [
    inventedView,
    erasedOutMessage,
    inventedOutMessage,
    erasedView,
    anyBlock,
    unknownBlock,
    overloadedBlock,
    overloadedCarrier,
    neverAsBlock,
    anyAsBlock,
    broadBlock,
    broadCarrier,
  ]
}
