import { Context, Data, Effect, Layer, Schema, Stream } from 'effect'
import { expect, expectTypeOf, it } from 'vitest'

import * as Command from '../command/public.js'
import { defineMessageUnion } from '../message/public.js'
import { modifyFields } from '../struct/public.js'
import type * as Update from '../update/public.js'
import * as Block from './public.js'
class Storage extends Context.Service<
  Storage,
  Readonly<{
    isAvailable: boolean
    save: (value: string) => Effect.Effect<void>
  }>
>()('BlockAuthoring/Storage') {}
class TrackingUnavailable extends Data.TaggedError('TrackingUnavailable')<{}> {}
const Model = Schema.Struct({ value: Schema.String })
const Message = defineMessageUnion({
  RequestedSave: { value: Schema.String },
  CompletedSave: {},
})
const ForeignMessage = defineMessageUnion({ ForeignCompleted: {} })
const OutMessage = defineMessageUnion({ Saved: { value: Schema.String } })
const Search = Block.define('Search', { Model, Message, OutMessage })
const Save = Search.command('Save', {
  args: { value: Schema.String },
  messages: [Message.CompletedSave],
  handler: function* () {
    const storage = yield* Storage
    return ({ value }) =>
      storage.save(value).pipe(Effect.as(Message.CompletedSave()))
  },
})
const ForeignInitCommand = Command.define('ForeignInitCommand', {
  messages: [ForeignMessage.ForeignCompleted],
})

type SearchInitReturn = Readonly<{ model: typeof Model.Type }>

function overloadedSearchInit(value: number): SearchInitReturn
function overloadedSearchInit(value: string): SearchInitReturn
function overloadedSearchInit(_value: number | string): SearchInitReturn {
  return { model: Model.make({ value: '' }) }
}

const TrackPointer = Search.mountStream('TrackPointer', {
  messages: [Message.CompletedSave],
  handler: function* () {
    const storage = yield* Storage
    if (!storage.isAvailable) {
      return yield* Effect.fail(new TrackingUnavailable())
    }

    return ({ element }) => {
      const exactElement: Element = element
      // @ts-expect-error A Mount handler receives an Element rather than a number.
      const invalidElement: number = element
      void [exactElement, invalidElement]

      return Stream.fromEffect(
        storage.save('tracked').pipe(Effect.as(Message.CompletedSave())),
      )
    }
  },
})
const search = Search.toComposition({})
const update = search.update((model, message) =>
  Message.match(message, {
    RequestedSave: ({ value }) => ({
      model: modifyFields(model, { value: () => value }),
      commands: [Save({ value })],
    }),
    CompletedSave: () => ({
      model,
      outMessage: OutMessage.Saved({ value: model.value }),
    }),
  }),
)
const clear = search.step(model => ({
  model: modifyFields(model, { value: () => '' }),
}))
const block = search.toBlock({
  init: () => ({ model: Model.make({ value: '' }) }),
  update,
  expose: { clear },
  EffectsLayer: Save.layer,
})
expectTypeOf<Update.RequirementsOf<typeof update>>().toEqualTypeOf<
  Command.HandlerOf<typeof Save>
>()
expectTypeOf<
  Layer.Services<typeof block.EffectsLayer>
>().toEqualTypeOf<Storage>()
expectTypeOf<
  Layer.Services<typeof TrackPointer.layer>
>().toEqualTypeOf<Storage>()
expectTypeOf<
  Layer.Error<typeof TrackPointer.layer>
>().toEqualTypeOf<TrackingUnavailable>()
expectTypeOf(clear(Model.make({ value: 'before' })).model).toEqualTypeOf<
  typeof Model.Type
>()
const Early = Block.define('Early')
const Shared = Early.command('Shared', {
  messages: [Message.CompletedSave],
  handler: function* () {
    return () => Effect.succeed(Message.CompletedSave())
  },
})
const first = Early.define({ Model, Message })
const second = Early.define({ Model, Message })
const firstBlock = first.toComposition().toBlock({
  init: () => ({ model: Model.make({ value: '' }) }),
  update: first.update(model => ({ model, commands: [Shared()] })),
  EffectsLayer: Shared.layer,
})
const secondBlock = second.toComposition().toBlock({
  init: () => ({ model: Model.make({ value: '' }) }),
  update: second.update(model => ({ model, commands: [Shared()] })),
  EffectsLayer: Shared.layer,
})
it('shares one owner across specialized contracts', () => {
  expect(firstBlock.owner).toBe(secondBlock.owner)
})

it('preserves typed and primitive helpers after composition', () => {
  expect(search.command).toBe(Search.command)
  expect(search.mount).toBe(Search.mount)
  expect(search.mountStream).toBe(Search.mountStream)
  expect(search.resource).toBe(Search.resource)
  expect(search.update).toBe(Search.update)
  expect(search.step).toBe(Search.step)
  expect(search.subscriptions).toBe(Search.subscriptions)
  expect(search.managedResources).toBe(Search.managedResources)
  expect(search).not.toHaveProperty('init')
})
if (false) {
  // @ts-expect-error A Composition does not expose the Definition-only init helper.
  search.init

  // @ts-expect-error Block init must return the Block Model.
  Search.init(() => ({ model: { value: 1 } }))
  Search.init(() => ({
    model: Model.make({ value: '' }),
    // @ts-expect-error Every Block init Command must return the Block Message.
    commands: [ForeignInitCommand()],
  }))
  // @ts-expect-error Initializers require one concrete call signature.
  Search.init(overloadedSearchInit)

  Search.command('AcceptedCommand', {
    messages: [Message.CompletedSave],
  })
  Search.mount('AcceptedMount', {
    messages: [Message.CompletedSave],
  })
  Search.mountStream('AcceptedMountStream', {
    messages: [Message.CompletedSave],
  })

  Search.command('ForeignCommand', {
    // @ts-expect-error Typed Block Commands must produce the owner's Message.
    messages: [ForeignMessage.ForeignCompleted],
  })
  Search.mount('ForeignMount', {
    // @ts-expect-error Typed Block Mounts must produce the owner's Message.
    messages: [ForeignMessage.ForeignCompleted],
  })
  Search.mountStream('ForeignMountStream', {
    // @ts-expect-error Typed Block stream Mounts must produce the owner's Message.
    messages: [ForeignMessage.ForeignCompleted],
  })
  search.command('RegisteredForeignCommand', {
    // @ts-expect-error Composition preserves the typed primitive Message boundary.
    messages: [ForeignMessage.ForeignCompleted],
  })

  const DeferredCommand = Early.command('DeferredCommand', {
    messages: [ForeignMessage.ForeignCompleted],
  })
  const DeferredMount = Early.mount('DeferredMount', {
    messages: [ForeignMessage.ForeignCompleted],
  })
  const DeferredMountStream = Early.mountStream('DeferredMountStream', {
    messages: [ForeignMessage.ForeignCompleted],
  })
  void [DeferredCommand, DeferredMount, DeferredMountStream]

  // @ts-expect-error Typed helpers retain the declared Message payload.
  update(Model.make({ value: '' }), Message.RequestedSave({ value: 1 }))
  // @ts-expect-error Missing local handler remains rejected.
  first.toComposition().toBlock({
    init: () => ({ model: Model.make({ value: '' }) }),
    update: first.update(model => ({ model, commands: [Shared()] })),
  })
  const Foreign = Block.define('Foreign', { Model, Message })
  const ForeignShared = Foreign.command('Shared', {
    messages: [Message.CompletedSave],
  })
  Foreign.toComposition().toBlock({
    init: () => ({ model: Model.make({ value: '' }) }),
    update: Foreign.update(model => ({ model, commands: [ForeignShared()] })),
    // @ts-expect-error A different owner cannot provide the local handler.
    EffectsLayer: Shared.layer,
  })
}
