// @vitest-environment node
import { Effect, Layer, Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { define } from '../../block/define.js'
import { defineMessageUnion } from '../../message/index.js'
import { define as defineApplication } from '../../runtime/applicationPublic.js'
import type { Url } from '../../url/index.js'
import { renderToString } from './server.js'

const Child = define('ServerChild')
const ChildModel = Schema.Struct({ title: Schema.String })
const ChildMessage = defineMessageUnion({
  ClickedPrepare: {},
  CompletedPrepare: {},
  CompletedObserve: {},
})
let constructions = 0
let executions = 0
const Prepare = Child.command('Prepare', {
  messages: [ChildMessage.CompletedPrepare],
  handler: function* () {
    yield* Effect.sync(() => {
      constructions += 1
    })

    return () =>
      Effect.sync(() => {
        executions += 1
        return ChildMessage.CompletedPrepare()
      })
  },
})
const Observe = Child.mount('Observe', {
  messages: [ChildMessage.CompletedObserve],
  handler: function* () {
    yield* Effect.sync(() => {
      constructions += 1
    })

    return () =>
      Effect.sync(() => {
        executions += 1
        return ChildMessage.CompletedObserve()
      })
  },
})
const childBase = Child.define({
  Model: ChildModel,
  Message: ChildMessage,
})
const child = childBase.register({ mounts: [Observe] })
const childImplementation = {
  init: (title: string) => ({ model: { title }, commands: [Prepare()] }),
  update: childBase.update(model => ({ model })),
  view: child.view((model, h) =>
    h.button(
      [h.OnMount(Observe()), h.OnClick(ChildMessage.ClickedPrepare())],
      [model.title],
    ),
  ),
  EffectsLayer: Layer.merge(Prepare.layer, Observe.layer),
}
const childBlock = child.toBlock(childImplementation)
const RootModel = Schema.Struct({ title: Schema.String })
const RootMessage = defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
})
const childBinding = childBlock.connection({
  read: (model: typeof RootModel.Type) => Option.some(model),
  write: (_model, nextChild) => nextChild,
  parentMessage: RootMessage.GotChildMessage,
})
const RootApplication = defineApplication({
  Model: RootModel,
  Message: RootMessage,
})
const RegisteredApplication = RootApplication.register({
  children: [childBinding],
})
const rootImplementation = {
  init: () => childBinding.init('Server-rendered child'),
  update: RootApplication.update(model => ({ model })),
  view: RegisteredApplication.view((model, h) => ({
    title: model.title,
    body: h.div(
      [],
      [h.block(childBinding.embedView({ slotId: 'child', model }))],
    ),
  })),
  EffectsLayer: Layer.empty,
}

const ServerFlags = Schema.Struct({ title: Schema.String })
type ServerFlags = typeof ServerFlags.Type

const FlagsApplication = defineApplication({
  Model: RootModel,
  Message: RootMessage,
})
const flagsImplementation = {
  init: (flags: ServerFlags) => ({ model: { title: flags.title } }),
  update: FlagsApplication.update(model => ({ model })),
  view: FlagsApplication.view((model, h) => ({
    title: model.title,
    body: h.main([], [model.title]),
  })),
  EffectsLayer: Layer.empty,
}

const RoutingApplication = defineApplication({
  Model: RootModel,
  Message: RootMessage,
})
const routingImplementation = {
  init: (url: Url) => ({ model: { title: url.pathname } }),
  update: RoutingApplication.update(model => ({ model })),
  view: RoutingApplication.view((model, h) => ({
    title: model.title,
    body: h.main([], [model.title]),
  })),
  EffectsLayer: Layer.empty,
}

const RoutingFlagsApplication = defineApplication({
  Model: RootModel,
  Message: RootMessage,
})
const routingFlagsImplementation = {
  init: (flags: ServerFlags, url: Url) => ({
    model: { title: `${flags.title}${url.pathname}` },
  }),
  update: RoutingFlagsApplication.update(model => ({ model })),
  view: RoutingFlagsApplication.view((model, h) => ({
    title: model.title,
    body: h.main([], [model.title]),
  })),
  EffectsLayer: Layer.empty,
}

const DataApplication = defineApplication({
  Model: RootModel,
  Message: RootMessage,
})
const dataImplementation = {
  init: () => ({ model: { title: 'data' } }),
  update: DataApplication.update(model => ({ model })),
  EffectsLayer: Layer.empty,
}

const HtmlApplication = defineApplication({
  Model: RootModel,
  Message: RootMessage,
})
const htmlImplementation = {
  init: () => ({ model: { title: 'html' } }),
  update: HtmlApplication.update(model => ({ model })),
  view: HtmlApplication.view((model, h) => h.main([], [model.title])),
  EffectsLayer: Layer.empty,
}

const OtherFlags = Schema.Struct({ count: Schema.Number })

const verifyServerBlockContracts = (): void => {
  const rootRender = renderToString(RegisteredApplication, rootImplementation, {
    isHydratable: false,
  })
  const flagsRender = renderToString(
    FlagsApplication,
    { ...flagsImplementation, Flags: ServerFlags },
    { flags: { title: 'flags' }, isHydratable: false },
  )
  const routingRender = renderToString(
    RoutingApplication,
    { ...routingImplementation, routing: {} },
    { url: 'https://foldkit.dev/docs', isHydratable: false },
  )
  const routingFlagsRender = renderToString(
    RoutingFlagsApplication,
    {
      ...routingFlagsImplementation,
      Flags: ServerFlags,
      routing: {},
    },
    {
      flags: { title: 'flags' },
      url: 'https://foldkit.dev/docs',
      isHydratable: false,
    },
  )

  const invalidDataRender = renderToString(
    DataApplication,
    // @ts-expect-error A server implementation must supply a page-owning Document view.
    dataImplementation,
    {
      isHydratable: false,
    },
  )

  const invalidHtmlRender = renderToString(
    HtmlApplication,
    // @ts-expect-error An embeddable HTML view cannot own the rendered Document.
    htmlImplementation,
    {
      isHydratable: false,
    },
  )

  const invalidFlagsValueRender = renderToString(
    FlagsApplication,
    // @ts-expect-error Render Flags must match the config's Flags Schema.
    { ...flagsImplementation, Flags: ServerFlags },
    { flags: { title: 1 }, isHydratable: false },
  )

  const invalidFlagsSchemaRender = renderToString(
    FlagsApplication,
    // @ts-expect-error The Flags Schema must match the root's init input.
    { ...flagsImplementation, Flags: OtherFlags },
    { flags: { count: 1 }, isHydratable: false },
  )

  const invalidRoutingRender = renderToString(
    RegisteredApplication,
    // @ts-expect-error A routing root must accept the parsed Url as its init input.
    { ...rootImplementation, routing: {} },
    { url: 'https://foldkit.dev', isHydratable: false },
  )

  void [
    rootRender,
    flagsRender,
    routingRender,
    routingFlagsRender,
    invalidDataRender,
    invalidHtmlRender,
    invalidFlagsValueRender,
    invalidFlagsSchemaRender,
    invalidRoutingRender,
  ]
}

void verifyServerBlockContracts

describe('Application definition server rendering', () => {
  it('renders a graphless definition created by the public define function', async () => {
    const rendered = await Effect.runPromise(
      renderToString(
        FlagsApplication,
        { ...flagsImplementation, Flags: ServerFlags },
        { flags: { title: 'Graphless root' }, isHydratable: false },
      ),
    )

    expect(rendered.title).toBe('Graphless root')
    expect(rendered.html).toContain('Graphless root')
  })

  it('renders registered child boundaries without constructing or executing handlers', async () => {
    const rendered = await Effect.runPromise(
      renderToString(RegisteredApplication, rootImplementation, {
        isHydratable: false,
      }),
    )
    expect(rendered.title).toBe('Server-rendered child')
    expect(rendered.html).toContain('Server-rendered child')
    expect(constructions).toBe(0)
    expect(executions).toBe(0)
  })
})
