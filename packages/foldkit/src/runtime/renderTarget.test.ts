// @vitest-environment node
import { Effect, Schema, Stream } from 'effect'
import { describe, expect, it } from 'vitest'

import * as Command from '../command/index.js'
import type { Document, Html, HtmlBuilder } from '../html/index.js'
import { defineMessageUnion } from '../message/index.js'
import * as Subscription from '../subscription/public.js'
import type * as Update from '../update/index.js'
import type { VNode } from '../vdom.js'
import { makeApplication } from './makeApplication.js'
import { makeElement } from './makeElement.js'
import type { RenderTarget } from './renderTarget.js'
import { embed } from './start.js'

const Message = defineMessageUnion({
  ClickedIncrement: {},
  ClickedFetch: {},
  CompletedFetch: { value: Schema.Number },
  Ticked: {},
  ClickedCrash: {},
})
type Message = typeof Message.Type

const Model = Schema.Struct({
  count: Schema.Number,
  ticks: Schema.Number,
  isTicking: Schema.Boolean,
})
type Model = typeof Model.Type

const Fetch = Command.define('Fetch', {
  messages: [Message.CompletedFetch],
  execute: Effect.succeed(Message.CompletedFetch({ value: 40 })),
})

const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    ClickedIncrement: () => ({ model: { ...model, count: model.count + 1 } }),
    ClickedFetch: () => ({ model, commands: [Fetch()] }),
    CompletedFetch: ({ value }) => ({ model: { ...model, count: value } }),
    Ticked: () => ({ model: { ...model, ticks: model.ticks + 1 } }),
    ClickedCrash: () => {
      throw new Error('boom')
    },
  })

const view = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('counter')],
    [
      h.span([h.Id('count')], [`${model.count}:${model.ticks}`]),
      h.button(
        [h.Id('increment'), h.OnClick(Message.ClickedIncrement())],
        ['+'],
      ),
      h.button([h.Id('fetch'), h.OnClick(Message.ClickedFetch())], ['fetch']),
      h.button([h.Id('crash'), h.OnClick(Message.ClickedCrash())], ['crash']),
    ],
  )

const subscriptions = Subscription.make<Model, Message>()(entry => ({
  ticks: entry(
    { isTicking: Schema.Boolean },
    {
      modelToDependencies: model => ({ isTicking: model.isTicking }),
      dependenciesToStream: ({ isTicking }) =>
        isTicking
          ? Stream.make(Message.Ticked(), Message.Ticked())
          : Stream.empty,
    },
  ),
}))

/** A target that records commits and runs frames only when the test flushes. */
const makeRecordingTarget = () => {
  const commits: Array<Document> = []
  const frames: Array<() => void> = []
  let releaseCount = 0
  const target: RenderTarget = {
    id: 'test-target',
    commit: document => {
      commits.push(document)
    },
    requestFrame: frame => {
      frames.push(frame)
    },
    release: () => {
      releaseCount += 1
    },
  }
  const flushFrames = () => {
    for (const frame of frames.splice(0)) frame()
  }
  const settle = async () => {
    for (let round = 0; round < 5; round++) {
      await new Promise(resolve => setTimeout(resolve, 0))
      flushFrames()
    }
  }
  const latest = () => commits[commits.length - 1]
  return { target, commits, settle, latest, releaseCount: () => releaseCount }
}

const findById = (
  node: VNode | string | undefined,
  id: string,
): VNode | undefined => {
  if (node === undefined || typeof node === 'string') return undefined
  if (node.data?.props?.['id'] === id) return node
  for (const child of node.children ?? []) {
    const found = findById(child, id)
    if (found !== undefined) return found
  }
  return undefined
}

const textOf = (node: VNode | undefined): string =>
  (node?.children ?? [])
    .map(child =>
      typeof child === 'string' ? child : (child.text ?? textOf(child)),
    )
    .join('')

const press = (document: Document | undefined, id: string) => {
  const button = findById(document?.body ?? undefined, id)
  const handler = button?.data?.on?.click
  expect(handler).toBeTypeOf('function')
  if (typeof handler === 'function' && button !== undefined) {
    // NOTE: Node has no PointerEvent; the click handler reads none of its fields.
    const click: PointerEvent = Object.create(new Event('click'))
    handler.call(button, click, button)
  }
}

describe('RenderTarget', () => {
  it('runs a makeElement program with no DOM: commits, handlers, Commands, Subscriptions', async () => {
    const recording = makeRecordingTarget()
    const program = makeElement({
      Model,
      init: () => ({ model: { count: 0, ticks: 0, isTicking: true } }),
      update,
      view,
      subscriptions,
      renderTarget: recording.target,
    })
    const handle = embed(program)
    await recording.settle()

    expect(
      textOf(findById(recording.latest()?.body ?? undefined, 'count')),
    ).toBe('0:2')

    press(recording.latest(), 'increment')
    await recording.settle()
    expect(
      textOf(findById(recording.latest()?.body ?? undefined, 'count')),
    ).toBe('1:2')

    press(recording.latest(), 'fetch')
    await recording.settle()
    expect(
      textOf(findById(recording.latest()?.body ?? undefined, 'count')),
    ).toBe('40:2')

    handle.dispose()
    await recording.settle()
    expect(recording.releaseCount()).toBe(1)
  })

  it('renders the crash view through the target', async () => {
    const recording = makeRecordingTarget()
    const handle = embed(
      makeElement({
        Model,
        init: () => ({ model: { count: 0, ticks: 0, isTicking: false } }),
        update,
        view,
        renderTarget: recording.target,
      }),
    )
    await recording.settle()
    press(recording.latest(), 'crash')
    await recording.settle()

    expect(recording.latest()?.title).toBe('Application Crash')
    handle.dispose()
  })

  it('hands makeApplication targets the whole Document, title included', async () => {
    const recording = makeRecordingTarget()
    const handle = embed(
      makeApplication({
        Model,
        init: () => ({ model: { count: 7, ticks: 0, isTicking: false } }),
        update,
        view: (model, h): Document => ({
          title: `Count ${model.count}`,
          body: view(model, h),
        }),
        renderTarget: recording.target,
      }),
    )
    await recording.settle()

    expect(recording.latest()?.title).toBe('Count 7')
    handle.dispose()
  })
})
