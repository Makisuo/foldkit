import { Context, Effect, Layer, Schema } from 'effect'
import { describe, expect, it, vi } from 'vitest'

import { renderToString } from '../experimental/server/server.js'
import type { AnyAuthoredView } from '../html/block.js'
import { __htmlBuilder } from '../html/index.js'
import { clearRuntime, setRuntime } from '../html/runtimeSingleton.js'
import { defineMessageUnion } from '../message/index.js'
import { define as defineApplication } from '../runtime/applicationPublic.js'
import * as Scene from '../test/scene.js'
import { define } from './define.js'
import { lowerBlock } from './lowering.js'

const Model = Schema.Struct({ count: Schema.Number })
const Message = defineMessageUnion({
  CompletedObserveFirst: {},
  CompletedObserveSecond: {},
})
const MountRegistration = define('MountRegistration', { Model, Message })
const constructed = vi.fn()
const ObserveFirst = MountRegistration.mount('ObserveFirst', {
  messages: [Message.CompletedObserveFirst],
  handler: function* () {
    yield* Effect.sync(constructed)

    return () => Effect.succeed(Message.CompletedObserveFirst())
  },
})
const ObserveSecond = MountRegistration.mount('ObserveSecond', {
  messages: [Message.CompletedObserveSecond],
  handler: function* () {
    yield* Effect.sync(constructed)

    return () => Effect.succeed(Message.CompletedObserveSecond())
  },
})
const first = MountRegistration.toComposition({ mounts: [ObserveFirst] })
const second = MountRegistration.toComposition({ mounts: [ObserveSecond] })
const both = MountRegistration.toComposition({
  mounts: [ObserveFirst, ObserveSecond],
})
const init = () => ({ model: Model.make({ count: 0 }) })
const update = MountRegistration.update(model => ({ model }))
const firstView = first.view((_model, h) => h.div([h.OnMount(ObserveFirst())]))
const secondView = second.view((_model, h) =>
  h.div([h.OnMount(ObserveSecond())]),
)
const firstBlock = first.toBlock({
  init,
  update,
  view: firstView,
  EffectsLayer: ObserveFirst.layer,
})
const render = (view: AnyAuthoredView) => {
  setRuntime(() => {}, Context.empty())
  try {
    return view(init().model, __htmlBuilder())
  } finally {
    clearRuntime()
  }
}

const Entry = Schema.Struct({ id: Schema.String, child: Model })
const ParentModel = Schema.Struct({
  child: Model,
  entries: Schema.Array(Entry),
})
const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: Message },
  GotEntryMessage: { id: Schema.String, message: Message },
})
const MountParent = define('MountParent', {
  Model: ParentModel,
  Message: ParentMessage,
})
const child = MountParent.bindChild(firstBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})
const entries = MountParent.bindChild(firstBlock, {
  field: 'entries',
  key: 'id',
  childField: 'child',
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
})
const parent = MountParent.toComposition({ children: [child, entries] })
const parentUpdate = MountParent.update(model => ({ model }))
const parentModel = ParentModel.make({
  child: init().model,
  entries: [Entry.make({ id: 'first', child: init().model })],
})

describe('captured local Mount registrations', () => {
  it('renders an exported registered view directly in Scene', () => {
    Scene.scene(
      { update, view: firstView },
      Scene.given(init().model),
      Scene.Mount.resolve(ObserveFirst, Message.CompletedObserveFirst()),
    )

    expect(constructed).not.toHaveBeenCalled()
  })

  it('rejects a view completed against a different local Mount set', () => {
    const block = first.toBlock({
      init,
      update,
      // @ts-expect-error The view requires a different local Mount registration.
      view: secondView,
      EffectsLayer: ObserveFirst.layer,
    })

    expect(() => render(lowerBlock(block).view)).toThrow(
      'This view uses Mounts that are not registered in its selected Block.',
    )
    expect(() => render(lowerBlock(firstBlock).view)).not.toThrow()
  })

  it('keeps an authored view narrower than its completion Mount set', () => {
    const view = first.view((_model, h) =>
      h.div([
        // @ts-expect-error Completion cannot grant this view an undeclared Mount.
        h.OnMount(ObserveSecond()),
      ]),
    )
    const block = both.toBlock({
      init,
      update,
      view,
      EffectsLayer: Layer.merge(ObserveFirst.layer, ObserveSecond.layer),
    })

    expect(() => render(lowerBlock(block).view)).toThrow(
      'Mount "MountRegistration/ObserveSecond" is not registered in this view\'s Mounts.',
    )
  })

  it('rejects an undeclared Mount in a graphless exported Scene view', () => {
    const view = MountRegistration.view((_model, h) =>
      h.div([
        // @ts-expect-error A graphless view has no Mount capabilities.
        h.OnMount(ObserveFirst()),
      ]),
    )

    expect(() =>
      Scene.scene({ update, view }, Scene.given(init().model)),
    ).toThrow("is not registered in this view's Mounts")
  })

  it('renders a declared Mount through static and keyed view overrides', () => {
    const staticView = parent.view((model, h) =>
      h.block(
        child.embedView({
          slotId: 'child',
          model: model.child,
          view: firstView,
        }),
      ),
    )
    const keyedView = parent.view((model, h) =>
      h.block(
        entries.embedView({
          slotId: 'entry',
          key: 'first',
          model: model.child,
          view: firstView,
        }),
      ),
    )

    for (const view of [staticView, keyedView]) {
      Scene.scene(
        { update: parentUpdate, view },
        Scene.given(parentModel),
        Scene.Mount.resolve(ObserveFirst, Message.CompletedObserveFirst()),
      )
    }
  })

  it('checks the selected static child before rendering a view override', () => {
    const view = parent.view((model, h) =>
      h.block(
        child.embedView({
          slotId: 'child',
          model: model.child,
          // @ts-expect-error The selected child does not register this override's Mount.
          view: secondView,
        }),
      ),
    )

    expect(() =>
      Scene.scene({ update: parentUpdate, view }, Scene.given(parentModel)),
    ).toThrow(
      'This view uses Mounts that are not registered in its selected Block.',
    )
  })

  it('checks the selected keyed child before rendering a view override', () => {
    const view = parent.view((model, h) =>
      h.block(
        entries.embedView({
          slotId: 'entry',
          key: 'first',
          model: model.child,
          // @ts-expect-error The selected child does not register this override's Mount.
          view: secondView,
        }),
      ),
    )

    expect(() =>
      Scene.scene({ update: parentUpdate, view }, Scene.given(parentModel)),
    ).toThrow(
      'This view uses Mounts that are not registered in its selected Block.',
    )
  })

  it('checks captured Mount sets during server rendering without building Layers', async () => {
    const Application = defineApplication({ Model, Message })
    const FocusFirst = Application.mount('FocusFirst', {
      messages: [Message.CompletedObserveFirst],
      handler: function* () {
        yield* Effect.sync(constructed)

        return () => Effect.succeed(Message.CompletedObserveFirst())
      },
    })
    const FocusSecond = Application.mount('FocusSecond', {
      messages: [Message.CompletedObserveSecond],
      handler: function* () {
        yield* Effect.sync(constructed)

        return () => Effect.succeed(Message.CompletedObserveSecond())
      },
    })
    const firstApplication = Application.toComposition({ mounts: [FocusFirst] })
    const secondApplication = Application.toComposition({
      mounts: [FocusSecond],
    })
    const applicationUpdate = Application.update(model => ({ model }))
    const view = secondApplication.view((_model, h) => ({
      title: 'Second',
      body: h.main([h.OnMount(FocusSecond())]),
    }))

    await expect(
      Effect.runPromise(
        renderToString(
          firstApplication,
          // @ts-expect-error SSR must reject a view with a different Mount graph.
          {
            init,
            update: applicationUpdate,
            view,
            EffectsLayer: FocusFirst.layer,
          },
          { isHydratable: false },
        ),
      ),
    ).rejects.toThrow(
      'This view uses Mounts that are not registered in its selected Block.',
    )
    expect(constructed).not.toHaveBeenCalled()
  })
})
