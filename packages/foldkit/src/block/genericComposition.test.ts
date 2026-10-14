import { Effect, Layer, Option, Schema } from 'effect'
import { expectTypeOf, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import * as Application from '../runtime/application.js'
import { define } from './define.js'

const Message = defineMessageUnion({
  RequestedWork: {},
  CompletedWork: {},
})
type Message = typeof Message.Type

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
  const definition = Feature.define({ Model, Message })

  return definition.toComposition().toBlock({
    init: () => ({ model: Model.make({ value: '' }) }),
    update: definition.update((model, message) =>
      Message.match(message, {
        RequestedWork: () => ({ model, commands: [Work()] }),
        CompletedWork: () => ({ model }),
      }),
    ),
    view: definition.view((model, h) => h.div([], [model.value])),
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
  const definition = Feature.define({ Model, Message })

  return definition.toComposition().toBlock({
    init: () => ({ model: Model.make({ value: '' }) }),
    update: definition.update((model, message) =>
      Message.match(message, {
        RequestedWork: () => ({ model, commands: [Work()] }),
        CompletedWork: () => ({ model }),
      }),
    ),
    view: definition.view((model, h) => h.div([], [model.value])),
    EffectsLayer: Layer.empty,
  })
}

const complete = makeGenericComplete('GenericComplete')
type CompleteModel = typeof complete.Model.Type

const CompleteParentDefinition = define('GenericCompleteParent', {
  Model: complete.Model,
  Message: complete.Message,
})
const completeBinding = CompleteParentDefinition.bindChild(complete, {
  read: (model: CompleteModel) => Option.some(model),
  write: (_model: CompleteModel, nextModel: CompleteModel) => nextModel,
  toParentMessage: (message: Message) => message,
})

it('keeps a complete generic Block connectable after literal instantiation', () => {
  expectTypeOf(completeBinding.placement).toEqualTypeOf<'GenericComplete'>()
})

if (false) {
  const missing = makeGenericMissing('GenericMissing')
  type MissingModel = typeof missing.Model.Type
  const MissingParentDefinition = define('GenericMissingParent', {
    Model: missing.Model,
    Message: missing.Message,
  })

  // @ts-expect-error Concrete Bindings validate deferred generic handler coverage.
  MissingParentDefinition.bindChild(missing, {
    read: (model: MissingModel) => Option.some(model),
    write: (_model: MissingModel, nextModel: MissingModel) => nextModel,
    toParentMessage: (message: Message) => message,
  })

  const checkRoot = (container: HTMLElement) => {
    // @ts-expect-error Root completion validates deferred generic handler coverage.
    Application.makeElement<typeof missing, { container: HTMLElement }>({
      block: missing,
      container,
    })
  }
  void checkRoot
}
