import { Effect, Option, Schema, Stream } from 'effect'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { define } from '../block/define.js'
import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import { define as defineApplication } from './applicationPublic.js'
import * as ModelPreservationBridge from './modelPreservationBridge.js'
import { embed } from './start.js'

const DEPENDENCY_FAILURE = 'Cannot derive Subscription dependencies'

let container: HTMLElement

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(ModelPreservationBridge, 'resolvePreservedModel').mockReturnValue(
    Effect.succeed(undefined),
  )
  container = document.createElement('div')
  container.id = 'subscription-startup'
  document.body.append(container)
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('Subscription startup supervision', () => {
  it('reports initial root dependency defects and keeps the crash view until disposal', async () => {
    const Model = Schema.Struct({ count: Schema.Number })
    const Message = defineMessageUnion({ EmittedPulse: {} })
    const Application = defineApplication({ Model, Message })
    const streamStarted = vi.fn()
    const report = vi.fn()
    const subscriptions = Application.subscriptions(entry => ({
      pulses: entry(
        'Pulses',
        { count: Schema.Number },
        {
          messages: [Message.EmittedPulse],
          modelToDependencies: () => {
            throw new Error(DEPENDENCY_FAILURE)
          },
          handler: function* () {
            return () => {
              streamStarted()
              return Stream.never
            }
          },
        },
      ),
    }))
    const ApplicationComposition = Application.toComposition()
    const application = ApplicationComposition.makeElement({
      container,
      init: () => ({ model: { count: 0 } }),
      update: Application.update(model => ({ model })),
      view: ApplicationComposition.view((_model, h) => h.div([], ['Running'])),
      subscriptions,
      EffectsLayer: subscriptions.pulses.layer,
      crash: {
        view: ({ error }, h) => h.div([], [error.message]),
        report,
      },
    })
    const handle = embed(application)

    try {
      await vi.waitFor(() => {
        expect(document.body.textContent).toBe(DEPENDENCY_FAILURE)
        expect(report).toHaveBeenCalledOnce()
      })
      expect(streamStarted).not.toHaveBeenCalled()
    } finally {
      handle.dispose()
      await vi.waitFor(() => {
        expect(document.getElementById(container.id)).toBe(container)
        expect(container.textContent).toBe('')
      })
    }
  })

  it('reports dependency defects when an optional child activates after startup', async () => {
    const ChildModel = Schema.Struct({ count: Schema.Number })
    const ChildMessage = defineMessageUnion({ EmittedPulse: {} })
    const Child = define('StartupChild', {
      Model: ChildModel,
      Message: ChildMessage,
    })
    const streamStarted = vi.fn()
    const subscriptions = Child.subscriptions(entry => ({
      pulses: entry(
        'Pulses',
        { count: Schema.Number },
        {
          messages: [ChildMessage.EmittedPulse],
          modelToDependencies: () => {
            throw new Error(DEPENDENCY_FAILURE)
          },
          handler: function* () {
            return () => {
              streamStarted()
              return Stream.never
            }
          },
        },
      ),
    }))
    const block = Child.toComposition().toBlock({
      init: () => ({ model: { count: 0 } }),
      update: Child.update(model => ({ model })),
      subscriptions,
      EffectsLayer: subscriptions.pulses.layer,
    })
    const Model = Schema.Struct({ maybeChild: Schema.Option(ChildModel) })
    const Message = defineMessageUnion({
      ClickedActivateChild: {},
      GotChildMessage: { message: ChildMessage },
    })
    const Application = defineApplication({ Model, Message })
    const child = Application.bindChild(block, {
      read: model => model.maybeChild,
      write: (model, nextChild) =>
        modifyFields(model, { maybeChild: () => Option.some(nextChild) }),
      parentMessage: Message.GotChildMessage,
    })
    const ApplicationComposition = Application.toComposition({
      children: [child],
    })
    const report = vi.fn()
    const application = ApplicationComposition.makeElement({
      container,
      init: () => ({ model: { maybeChild: Option.none() } }),
      update: Application.update((model, message) =>
        Message.match(message, {
          ClickedActivateChild: () => ({
            model: modifyFields(model, {
              maybeChild: () => Option.some(child.init().model),
            }),
          }),
          GotChildMessage: ({ message }) => child.fold(model, message),
        }),
      ),
      view: Application.view((_model, h) =>
        h.button(
          [h.Id('activate-child'), h.OnClick(Message.ClickedActivateChild())],
          ['Activate child'],
        ),
      ),
      crash: {
        view: ({ error }, h) => h.div([], [error.message]),
        report,
      },
    })
    const handle = embed(application)

    try {
      await vi.waitFor(() =>
        expect(document.body.textContent).toBe('Activate child'),
      )
      expect(report).not.toHaveBeenCalled()
      const button =
        document.querySelector<HTMLButtonElement>('#activate-child')
      if (button === null) {
        throw new Error('Missing child activation button')
      }
      button.click()

      await vi.waitFor(() => {
        expect(document.body.textContent).toBe(DEPENDENCY_FAILURE)
        expect(report).toHaveBeenCalledOnce()
      })
      expect(streamStarted).not.toHaveBeenCalled()
    } finally {
      handle.dispose()
      await vi.waitFor(() => {
        expect(document.getElementById(container.id)).toBe(container)
        expect(container.textContent).toBe('')
      })
    }
  })
})
