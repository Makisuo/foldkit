// @vitest-environment node
import { Effect, Layer, Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { define } from '../../block/define.js'
import { defineMessageUnion } from '../../message/index.js'
import { define as defineApplication } from '../../runtime/applicationPublic.js'
import type { Url } from '../../url/index.js'
import { renderToString } from './server.js'

const ChildDefinition = define('ServerChild')
const ChildModel = Schema.Struct({ title: Schema.String })
const ChildMessage = defineMessageUnion({
  ClickedPrepare: {},
  CompletedPrepare: {},
  CompletedObserve: {},
})
let constructions = 0
let executions = 0
const Prepare = ChildDefinition.command('Prepare', {
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
const Observe = ChildDefinition.mount('Observe', {
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
const ChildBaseDefinition = ChildDefinition.define({
  Model: ChildModel,
  Message: ChildMessage,
})
const child = ChildBaseDefinition.makeComposition({ mounts: [Observe] })
const childImplementation = {
  init: (title: string) => ({ model: { title }, commands: [Prepare()] }),
  update: child.makeUpdate(model => ({ model })),
  view: child.makeView((model, h) =>
    h.button(
      [h.OnMount(Observe()), h.OnClick(ChildMessage.ClickedPrepare())],
      [model.title],
    ),
  ),
  EffectsLayer: Layer.merge(Prepare.layer, Observe.layer),
}
const childBlock = child.makeBlock(childImplementation)
const RootModel = Schema.Struct({ title: Schema.String })
const RootMessage = defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
})
const RootApplicationDefinition = defineApplication({
  Model: RootModel,
  Message: RootMessage,
})
const PlainMessage = Schema.Never
const ChildBinding = RootApplicationDefinition.bindChild(childBlock, {
  read: model => Option.some(model),
  write: (_model, nextChild) => nextChild,
  parentMessage: RootMessage.GotChildMessage,
})
const RegisteredApplication = RootApplicationDefinition.makeComposition({
  childBindings: [ChildBinding],
})
const rootImplementation = {
  init: RegisteredApplication.makeInit(() =>
    ChildBinding.init({
      args: ['Server-rendered child'],
      toParentModel: child => child,
    }),
  ),
  update: RegisteredApplication.makeUpdate(),
  view: RegisteredApplication.makeView((model, h) => ({
    title: model.title,
    body: h.div(
      [],
      [h.block(ChildBinding.embedView({ slotId: 'child', model }))],
    ),
  })),
  EffectsLayer: Layer.empty,
}

const ServerFlags = Schema.Struct({ title: Schema.String })
type ServerFlags = typeof ServerFlags.Type

const FlagsApplicationDefinition = defineApplication({
  Model: RootModel,
  Message: PlainMessage,
})
const FlagsComposition = FlagsApplicationDefinition.makeComposition()
const flagsImplementation = {
  init: (flags: ServerFlags) => ({ model: { title: flags.title } }),
  update: FlagsComposition.makeUpdate(),
  view: FlagsComposition.makeView((model, h) => ({
    title: model.title,
    body: h.main([], [model.title]),
  })),
  EffectsLayer: Layer.empty,
}

const RoutingApplicationDefinition = defineApplication({
  Model: RootModel,
  Message: PlainMessage,
})
const RoutingComposition = RoutingApplicationDefinition.makeComposition()
const routingImplementation = {
  init: (url: Url) => ({ model: { title: url.pathname } }),
  update: RoutingComposition.makeUpdate(),
  view: RoutingComposition.makeView((model, h) => ({
    title: model.title,
    body: h.main([], [model.title]),
  })),
  EffectsLayer: Layer.empty,
}

const RoutingFlagsApplicationDefinition = defineApplication({
  Model: RootModel,
  Message: PlainMessage,
})
const RoutingFlagsComposition =
  RoutingFlagsApplicationDefinition.makeComposition()
const routingFlagsImplementation = {
  init: (flags: ServerFlags, url: Url) => ({
    model: { title: `${flags.title}${url.pathname}` },
  }),
  update: RoutingFlagsComposition.makeUpdate(),
  view: RoutingFlagsComposition.makeView((model, h) => ({
    title: model.title,
    body: h.main([], [model.title]),
  })),
  EffectsLayer: Layer.empty,
}

const DataApplicationDefinition = defineApplication({
  Model: RootModel,
  Message: PlainMessage,
})
const DataComposition = DataApplicationDefinition.makeComposition()
const dataImplementation = {
  init: () => ({ model: { title: 'data' } }),
  update: DataComposition.makeUpdate(),
  EffectsLayer: Layer.empty,
}

const HtmlApplicationDefinition = defineApplication({
  Model: RootModel,
  Message: PlainMessage,
})
const HtmlComposition = HtmlApplicationDefinition.makeComposition()
const htmlImplementation = {
  init: () => ({ model: { title: 'html' } }),
  update: HtmlComposition.makeUpdate(),
  view: HtmlComposition.makeView((model, h) => h.main([], [model.title])),
  EffectsLayer: Layer.empty,
}

const OtherFlags = Schema.Struct({ count: Schema.Number })

const verifyServerBlockContracts = (): void => {
  const rootRender = renderToString(RegisteredApplication, rootImplementation, {
    isHydratable: false,
  })
  const flagsRender = renderToString(
    FlagsComposition,
    { ...flagsImplementation, Flags: ServerFlags },
    { flags: { title: 'flags' }, isHydratable: false },
  )
  const routingRender = renderToString(
    RoutingComposition,
    { ...routingImplementation, routing: {} },
    { url: 'https://foldkit.dev/docs', isHydratable: false },
  )
  const routingFlagsRender = renderToString(
    RoutingFlagsComposition,
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
    DataComposition,
    // @ts-expect-error A server implementation must supply a page-owning Document view.
    dataImplementation,
    {
      isHydratable: false,
    },
  )

  const invalidHtmlRender = renderToString(
    HtmlComposition,
    // @ts-expect-error An embeddable HTML view cannot own the rendered Document.
    htmlImplementation,
    {
      isHydratable: false,
    },
  )

  const invalidFlagsValueRender = renderToString(
    FlagsComposition,
    // @ts-expect-error Render Flags must match the config's Flags Schema.
    { ...flagsImplementation, Flags: ServerFlags },
    { flags: { title: 1 }, isHydratable: false },
  )

  const invalidFlagsSchemaRender = renderToString(
    FlagsComposition,
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
        FlagsComposition,
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
