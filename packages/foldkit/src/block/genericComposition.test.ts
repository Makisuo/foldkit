import { Effect, Layer, Schema } from 'effect'
import { expectTypeOf, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { define } from './define.js'

const Message = defineMessageUnion({
  RequestedWork: {},
  CompletedWork: {},
})
type Message = typeof Message.Type
const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: Message },
})

const makeGenericComplete = <const Id extends string>(id: Id) => {
  const Feature = define(id)
  const Model = Schema.Struct({ value: Schema.String })
  type Model = typeof Model.Type
  const Work = Feature.command('Work', {
    messages: [Message.CompletedWork],
    handler: function* () {
      return () => Effect.succeed(Message.CompletedWork())
    },
  })
  const CompleteDefinition = Feature.define({ Model, Message })
  const composition = CompleteDefinition.makeComposition()

  return composition.makeBlock({
    init: () => ({ model: Model.make({ value: '' }) }),
    update: composition.makeUpdate((model, message) =>
      Message.match(message, {
        RequestedWork: () => ({ model, commands: [Work()] }),
        CompletedWork: () => ({ model }),
      }),
    ),
    view: composition.makeView((model, h) => h.div([], [model.value])),
    EffectsLayer: Work.layer,
  })
}

const makeGenericMissing = <const Id extends string>(id: Id) => {
  const Feature = define(id)
  const Model = Schema.Struct({ value: Schema.String })
  type Model = typeof Model.Type
  const Work = Feature.command('Work', {
    messages: [Message.CompletedWork],
  })
  const MissingDefinition = Feature.define({ Model, Message })
  const composition = MissingDefinition.makeComposition()

  return composition.makeBlock({
    init: () => ({ model: Model.make({ value: '' }) }),
    update: composition.makeUpdate((model, message) =>
      Message.match(message, {
        RequestedWork: () => ({ model, commands: [Work()] }),
        CompletedWork: () => ({ model }),
      }),
    ),
    view: composition.makeView((model, h) => h.div([], [model.value])),
    EffectsLayer: Layer.empty,
  })
}

const complete = makeGenericComplete('GenericComplete')
const CompleteParentModel = Schema.Struct({ child: complete.Model })

const CompleteParent = define('GenericCompleteParent', {
  Model: CompleteParentModel,
  Message: ParentMessage,
})
const CompleteBinding = CompleteParent.bindChild(complete, {
  placement: 'GenericComplete',
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})

it('keeps a complete generic Block connectable after literal instantiation', () => {
  expectTypeOf(CompleteBinding.placement).toEqualTypeOf<'GenericComplete'>()
})

if (false) {
  const missing = makeGenericMissing('GenericMissing')
  const MissingParentModel = Schema.Struct({ child: missing.Model })
  const MissingParent = define('GenericMissingParent', {
    Model: MissingParentModel,
    Message: ParentMessage,
  })

  // @ts-expect-error Concrete Bindings validate deferred generic handler coverage.
  MissingParent.bindChild(missing, {
    placement: 'GenericMissing',
    field: 'child',
    parentMessage: ParentMessage.GotChildMessage,
  })
}
