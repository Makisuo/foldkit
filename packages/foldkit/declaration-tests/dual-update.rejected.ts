import { Effect, Layer, Schema } from 'effect'
import * as Block from 'foldkit/block'
import { defineMessageUnion } from 'foldkit/message'
import { run } from 'foldkit/runtime'
import * as Update from 'foldkit/update'

import {
  ChildBlock,
  ParentDefinition,
  ParentMessage,
  PersistLayer,
  RequiredRestBlock,
  RequiredRestParentDefinition,
  RequiredRestParentMessage,
  RootComposition,
  SaveClient,
  makePendingApplication,
  parentMessage,
  parentModel,
  parentUpdate,
  rootInit,
  rootUpdate,
  rootView,
} from './dual-update.accepted.js'

const Model = Schema.Struct({ count: Schema.Number })
const Message = defineMessageUnion({ ChangedCount: { amount: Schema.Number } })
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct Block or Application identity for type coverage.
const CounterDefinition = Block.define('DualUpdateRejectedCounter', {
  Model,
  Message,
})
// oxlint-disable-next-line foldkit/block-name-matches-variable -- This fixture deliberately uses a distinct Block or Application identity for type coverage.
const Composition = CounterDefinition.makeComposition()
const update = Composition.makeUpdate(
  (model, _message, _context: Readonly<{ multiplier: number }>) => ({ model }),
)
const message = Message.ChangedCount({ amount: 1 })
const model = Model.make({ count: 0 })
const step = update(message)

// @ts-expect-error Required context is supplied after the curried Step's Model.
step(model)

// @ts-expect-error A context-bearing curried update is not a unary Step.
Update.combine(model, [step])

// @ts-expect-error The two-argument form is the canonical data-first call.
update(message, { multiplier: 2 })

// @ts-expect-error The data-first form retains the required context.
update(model, message)

RequiredRestParentDefinition.bindChild(RequiredRestBlock, {
  // @ts-expect-error A required-rest contextual child must provide fromParentMessage.
  field: 'child',
  // @ts-expect-error A required-rest contextual child must provide fromParentMessage.
  parentMessage: RequiredRestParentMessage.GotChildMessage,
})

const AlternativeChildBinding = ParentDefinition.bindChild(ChildBlock, {
  field: 'child',
  placement: 'alternative',
  parentMessage: ParentMessage.GotChildMessage,
})
const OmittedComposition = ParentDefinition.makeComposition({
  childBindings: [AlternativeChildBinding],
})
const omittedDirectUpdate = OmittedComposition.makeUpdate((current, _message) =>
  parentUpdate(parentMessage)(current),
)
const omittedComposedUpdate = OmittedComposition.makeUpdate(
  (current, _message) => Update.combine(current, [parentUpdate(parentMessage)]),
)

// @ts-expect-error A curried routed update retains its omitted Binding evidence.
OmittedComposition.makeBlock({
  init: () => ({ model: parentModel }),
  update: omittedDirectUpdate,
  EffectsLayer: Layer.empty,
})

// @ts-expect-error Update.combine retains the curried routed update's omitted Binding evidence.
OmittedComposition.makeBlock({
  init: () => ({ model: parentModel }),
  update: omittedComposedUpdate,
  EffectsLayer: Layer.empty,
})

OmittedComposition.makeBlock({
  init: () => ({ model: parentModel }),
  update: OmittedComposition.makeUpdate((current, _message) => ({
    model: current,
  })),
  // @ts-expect-error Exposed operations produce local Message tuples, not Model-first Steps.
  operations: { handleChild: parentUpdate(parentMessage) },
  EffectsLayer: Layer.empty,
})

// @ts-expect-error Root completion still requires the update's Command handler Layer.
RootComposition.makeApplication({
  container: null,
  init: rootInit,
  update: rootUpdate,
  view: rootView,
})

// @ts-expect-error A completed Application cannot run before its ordinary Service is provided.
run(makePendingApplication())

run(
  makePendingApplication().provide(
    Layer.succeed(SaveClient, { save: Effect.void }),
  ),
)

void PersistLayer
