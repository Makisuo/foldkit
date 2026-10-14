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

  return definition.toBlock({
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

  return definition.toBlock({
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

const completeBinding = complete.connection({
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

  missing.connection({
    // @ts-expect-error Concrete static connections validate deferred generic handler coverage.
    read: (model: MissingModel) => Option.some(model),
    // @ts-expect-error Concrete static connections validate deferred generic handler coverage.
    write: (_model: MissingModel, nextModel: MissingModel) => nextModel,
    toParentMessage: (message: Message) => message,
  })

  // @ts-expect-error Concrete keyed connections validate deferred generic handler coverage.
  missing.keyedConnection({
    readAll: (model: MissingModel) => [model],
    key: () => 'only',
    read: model => model,
    writeAt: (_model, _key, nextModel) => nextModel,
    toParentMessage: (_key, message: Message) => message,
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
