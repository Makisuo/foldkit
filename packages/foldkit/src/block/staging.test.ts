import { Context, Effect, Layer, Option, Schema } from 'effect'
import { expect, expectTypeOf, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import { define } from './define.js'

class ObserveDependency extends Context.Service<ObserveDependency, object>()(
  'BlockStaging/ObserveDependency',
) {}

const unavailable: Effect.Effect<void, 'ObserveUnavailable'> =
  Effect.fail('ObserveUnavailable')

const ChildOwner = define('StagedChild')
const ChildModel = Schema.Struct({ value: Schema.String })
type ChildModel = typeof ChildModel.Type
const ChildMessage = defineMessageUnion({
  CompletedObserve: {},
  CompletedMeasure: {},
})
type ChildMessage = typeof ChildMessage.Type

const Observe = ChildOwner.mount('Observe', {
  messages: [ChildMessage.CompletedObserve],
  handler: function* () {
    yield* ObserveDependency
    yield* unavailable

    return () => Effect.succeed(ChildMessage.CompletedObserve())
  },
})

const Measure = ChildOwner.mount('Measure', {
  messages: [ChildMessage.CompletedMeasure],
})

const childBase = ChildOwner.define({
  Model: ChildModel,
  Message: ChildMessage,
})
const graphlessComposition = childBase.toComposition()
const observeComposition = childBase.toComposition({ mounts: [Observe] })
const measureComposition = childBase.toComposition({ mounts: [Measure] })

const graphlessView = graphlessComposition.view((model, h) =>
  h.div([], [model.value]),
)

const defaultView = observeComposition.view.withInputs<
  Readonly<{ label: string }>
>((model, { label }, h) =>
  h.div([h.OnMount(Observe())], [`${label}: ${model.value}`]),
)

const Child = observeComposition.toBlock({
  init: () => ({ model: ChildModel.make({ value: 'initial' }) }),
  update: observeComposition.update(model => ({ model })),
  view: defaultView,
  EffectsLayer: Observe.layer,
})

const ParentModel = Schema.Struct({ child: ChildModel })
type ParentModel = typeof ParentModel.Type
const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
})
type ParentMessage = typeof ParentMessage.Type
const Parent = define('StagedParent', {
  Model: ParentModel,
  Message: ParentMessage,
})

const DirectChildBinding = Parent.bindChild(Child, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})

const ExplicitChildBinding = Parent.bindChild(Child, {
  read: model => Option.some(model.child),
  write: (_model, child) => ParentModel.make({ child }),
  parentMessage: ParentMessage.GotChildMessage,
})

const alternateView = Child.view.withInputs<Readonly<{ prefix: string }>>(
  (model, { prefix }, h) =>
    h.div([h.OnMount(Observe())], [`${prefix}: ${model.value}`]),
)

const initialParent = ParentModel.make({
  child: ChildModel.make({ value: 'initial' }),
})
const defaultEmbed = DirectChildBinding.embedView({
  slotId: 'default-child',
  model: initialParent.child,
  viewInputs: { label: 'Default' },
})
const alternateEmbed = DirectChildBinding.embedView({
  slotId: 'alternate-child',
  model: initialParent.child,
  view: alternateView,
  viewInputs: { prefix: 'Alternate' },
})

if (false) {
  // @ts-expect-error A Definition does not author the primary view.
  childBase.view

  graphlessComposition.view((_model, h) =>
    h.div([
      // @ts-expect-error A graphless Composition cannot use an unregistered Mount.
      h.OnMount(Observe()),
    ]),
  )

  graphlessComposition.toBlock({
    init: Child.init,
    update: Child.update,
    // @ts-expect-error A graphless Composition cannot complete a Mount-capable view.
    view: defaultView,
    EffectsLayer: Observe.layer,
  })

  graphlessComposition.view((_model, h) =>
    h.button([
      // @ts-expect-error A view accepts only its Composition's Message.
      h.OnClick({ _tag: 'ForeignMessage' }),
    ]),
  )

  // @ts-expect-error void cannot describe usable per-render ViewInputs.
  graphlessComposition.view.withInputs<void>((_model, _inputs, h) => h.empty)

  // @ts-expect-error A Composition cannot establish another graph.
  observeComposition.toComposition({ mounts: [Measure] })

  DirectChildBinding.embedView({
    slotId: 'missing-default-inputs',
    model: initialParent.child,
    // @ts-expect-error The completed Block retains its default ViewInputs.
    viewInputs: { prefix: 'Wrong' },
  })

  const ForeignModel = Schema.Struct({ unrelated: Schema.String })
  const foreignModelBase = define('StagedForeignModelParent').define({
    Model: ForeignModel,
    Message: ParentMessage,
  })
  // @ts-expect-error A child Binding must use the Composition's parent Model.
  foreignModelBase.toComposition({ childBindings: [DirectChildBinding] })

  const ForeignMessage = defineMessageUnion({ ReceivedForeign: {} })
  const foreignMessageBase = define('StagedForeignMessageParent').define({
    Model: ParentModel,
    Message: ForeignMessage,
  })
  // @ts-expect-error A child Binding must use the Composition's parent Message.
  foreignMessageBase.toComposition({ childBindings: [DirectChildBinding] })
}

it('creates independent immutable graphs from one typed Base', () => {
  expect(childBase.mounts).toEqual([])
  expect(childBase).not.toHaveProperty('view')
  expect(graphlessComposition.view).toBeTypeOf('function')
  void graphlessView
  expect(observeComposition.owner).toBe(childBase.owner)
  expect(observeComposition.update).toBeTypeOf('function')
  expect(observeComposition).not.toHaveProperty('step')
  expect(observeComposition).not.toHaveProperty('subscriptions')
  expect(observeComposition).not.toHaveProperty('managedResources')
  expect(measureComposition.owner).toBe(childBase.owner)
  expect(observeComposition).not.toBe(measureComposition)
  expect(observeComposition.mounts).toEqual([Observe])
  expect(measureComposition.mounts).toEqual([Measure])
})

it('preserves completed view capabilities and default ViewInputs', () => {
  expect(defaultEmbed.view).toBe(defaultView)
  expectTypeOf(defaultEmbed.viewInputs).toEqualTypeOf<
    Readonly<{ label: string }>
  >()
  expect(alternateEmbed.view).toBe(alternateView)
  expectTypeOf(alternateEmbed.viewInputs).toEqualTypeOf<
    Readonly<{ prefix: string }>
  >()
})

it('matches required-field and explicit Binding behavior', () => {
  const directUpdate = DirectChildBinding.fold(
    initialParent,
    ChildMessage.CompletedObserve(),
  )
  const explicitUpdate = ExplicitChildBinding.fold(
    initialParent,
    ChildMessage.CompletedObserve(),
  )

  expect(directUpdate.model).toEqual(explicitUpdate.model)
})

it('preserves graph constructor errors and requirements exactly', () => {
  expectTypeOf<
    Layer.Services<typeof Child.EffectsLayer>
  >().toEqualTypeOf<ObserveDependency>()
  expectTypeOf<
    Layer.Error<typeof Child.EffectsLayer>
  >().toEqualTypeOf<'ObserveUnavailable'>()
})

it('retains contextual update and Step inference after registration', () => {
  const update = observeComposition.update((model, message) => {
    expectTypeOf(model).toEqualTypeOf<ChildModel>()
    expectTypeOf(message).toEqualTypeOf<ChildMessage>()
    return { model }
  })
  const setValue = childBase.step((model, value: string) => {
    expectTypeOf(model).toEqualTypeOf<ChildModel>()
    return { model: modifyFields(model, { value: () => value }) }
  })

  expect(
    update(
      ChildModel.make({ value: 'before' }),
      ChildMessage.CompletedObserve(),
    ).model.value,
  ).toBe('before')
  expect(
    setValue(ChildModel.make({ value: 'before' }), 'after').model.value,
  ).toBe('after')

  if (false) {
    // @ts-expect-error Registered helpers preserve the exact Message boundary.
    update(ChildModel.make({ value: 'before' }), { _tag: 'ForeignMessage' })
    // @ts-expect-error Additional Step parameters preserve their domain type.
    setValue(ChildModel.make({ value: 'before' }), 1)
  }
})
