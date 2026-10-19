import { Context, Effect, Layer, Option, Schema } from 'effect'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as Block from '../block/public.js'
import { defineMessageUnion } from '../message/index.js'
import { UrlRequest } from '../navigation/urlRequest.js'
import { modifyFields } from '../struct/index.js'
import * as Url from '../url/index.js'
import { normalizeRoutingConfig } from './browserListeners.js'
import * as ModelPreservationBridge from './modelPreservationBridge.js'
import * as Program from './programPublic.js'
import { assertElementHtml, assertProgramConfig } from './programRoot.js'
import { embed } from './start.js'

class RootSource extends Context.Service<
  RootSource,
  Readonly<{ read: Effect.Effect<string> }>
>()('ProgramRoot/RootSource') {}

beforeEach(() => {
  vi.spyOn(ModelPreservationBridge, 'resolvePreservedModel').mockReturnValue(
    Effect.succeed(undefined),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('completed root Block hosting', () => {
  it('hosts a message-free page without Flags or ordinary Service providers', () => {
    const ProgramPageComposition = Block.makeDefinition('ProgramPage', {
      Model: Schema.Struct({ count: Schema.Number }),
      Message: Schema.Never,
    }).makeComposition()
    const ProgramPageBlock = ProgramPageComposition.assembleBlock({
      init: ProgramPageComposition.makeInit(() => ({ model: { count: 0 } })),
      update: ProgramPageComposition.makeUpdate(),
      view: ProgramPageComposition.makeView((model, h) => ({
        title: 'Counter',
        body: h.div([], [globalThis.String(model.count)]),
      })),
    })
    const program = Program.make({
      block: ProgramPageBlock,
      container: document.createElement('div'),
    })

    expect(program.start).toBeTypeOf('function')
  })

  it('constructs nothing until Runtime starts and retains one handler lifetime', async () => {
    let initializerCalls = 0
    let handlerAcquisitions = 0
    let handlerReleases = 0
    let serviceReads = 0

    const Model = Schema.Struct({ value: Schema.String })
    const Message = defineMessageUnion({
      ClickedReadValue: {},
      CompletedReadValue: { value: Schema.String },
    })
    const ProgramRootDefinition = Block.makeDefinition('ProgramRoot', {
      Model,
      Message,
    })
    const ReadValue = ProgramRootDefinition.command('ReadValue', {
      messages: [Message.CompletedReadValue],
      handler: function* () {
        const source = yield* RootSource

        yield* Effect.acquireRelease(
          Effect.sync(() => {
            handlerAcquisitions += 1
          }),
          () =>
            Effect.sync(() => {
              handlerReleases += 1
            }),
        )

        return () =>
          source.read.pipe(
            Effect.map(value => Message.CompletedReadValue({ value })),
          )
      },
    })
    const ProgramRootComposition = ProgramRootDefinition.makeComposition()
    const init = ProgramRootComposition.makeInit(() => {
      initializerCalls += 1

      return { model: { value: 'Initial' } }
    })
    const update = ProgramRootComposition.makeUpdate((model, message) =>
      Message.match(message, {
        ClickedReadValue: () => ({ model, commands: [ReadValue()] }),
        CompletedReadValue: ({ value }) => ({
          model: modifyFields(model, { value: () => value }),
        }),
      }),
    )
    const view = ProgramRootComposition.makeView((model, h) =>
      h.button([h.OnClick(Message.ClickedReadValue())], [model.value]),
    )
    const ProgramRootBlock = ProgramRootComposition.assembleBlock({
      init,
      update,
      view,
      EffectsLayer: ReadValue.layer,
    })
    const container = document.createElement('div')
    container.id = 'program-root'
    document.body.append(container)

    const program = Program.makeElement({
      block: ProgramRootBlock,
      container,
      devTools: false,
      slow: false,
    }).provide(
      Layer.succeed(RootSource, {
        read: Effect.sync(() => {
          serviceReads += 1

          return 'Read value'
        }),
      }),
    )

    expect(initializerCalls).toBe(0)
    expect(handlerAcquisitions).toBe(0)
    expect(handlerReleases).toBe(0)
    expect(serviceReads).toBe(0)

    const handle = embed(program)

    try {
      await vi.waitFor(() => expect(document.body.textContent).toBe('Initial'))
      document.querySelector('button')?.click()
      await vi.waitFor(() =>
        expect(document.body.textContent).toBe('Read value'),
      )
      document.querySelector('button')?.click()
      await vi.waitFor(() => expect(serviceReads).toBe(2))

      expect(initializerCalls).toBe(1)
      expect(handlerAcquisitions).toBe(1)
      expect(handlerReleases).toBe(0)
    } finally {
      handle.dispose()
      container.remove()
    }

    await vi.waitFor(() => expect(handlerReleases).toBe(1))
  })

  it('wraps canonical routing payloads and preserves custom callback inputs', () => {
    const Message = defineMessageUnion({
      ClickedLink: { request: UrlRequest },
      ChangedUrl: { url: Url.Url },
    })
    const url = Option.getOrThrow(Url.fromString('https://foldkit.dev/docs'))
    const request = UrlRequest.Internal({ url })
    const constructors = normalizeRoutingConfig({
      onUrlRequest: Message.ClickedLink,
      onUrlChange: Message.ChangedUrl,
    })
    const callbacks = normalizeRoutingConfig({
      onUrlRequest: request => Message.ClickedLink({ request }),
      onUrlChange: url => Message.ChangedUrl({ url }),
    })

    expect(constructors.onUrlRequest(request)).toEqual(
      Message.ClickedLink({ request }),
    )
    expect(constructors.onUrlChange(url)).toEqual(Message.ChangedUrl({ url }))
    expect(callbacks.onUrlRequest(request)).toEqual(
      constructors.onUrlRequest(request),
    )
    expect(callbacks.onUrlChange(url)).toEqual(constructors.onUrlChange(url))
  })

  it('rejects malformed erased host configurations before lowering', () => {
    const ErasedRootComposition = Block.makeDefinition('ErasedRoot', {
      Model: Schema.Struct({ value: Schema.String }),
      Message: Schema.Never,
    }).makeComposition()
    const ErasedRootBlock = ErasedRootComposition.assembleBlock({
      init: () => ({ model: { value: 'ready' } }),
      update: ErasedRootComposition.makeUpdate(),
      view: ErasedRootComposition.makeView((model, h) =>
        h.div([], [model.value]),
      ),
    })

    expect(() =>
      assertProgramConfig(
        { block: ErasedRootBlock, container: null, routing: undefined },
        'Document',
      ),
    ).toThrow('Program routing must supply')
    expect(() =>
      assertProgramConfig(
        { block: ErasedRootBlock, container: null, Flags: {} },
        'Element',
      ),
    ).toThrow('field "Flags" must be a Schema')
    expect(() =>
      assertProgramConfig(
        { block: ErasedRootBlock, container: null, Flags: Schema.String },
        'Element',
      ),
    ).toThrow('requires Flags and flags together')
    expect(() =>
      assertProgramConfig(
        {
          block: ErasedRootBlock,
          container: null,
          Flags: Schema.String,
          flags: 'ready',
        },
        'Element',
      ),
    ).toThrow('field "flags" must be an Effect')
    expect(() =>
      assertProgramConfig({ block: {}, container: null }, 'Element'),
    ).toThrow('must be a completed Block')
    expect(() =>
      assertProgramConfig(
        { block: ErasedRootBlock, container: null, unsupported: true },
        'Element',
      ),
    ).toThrow('configuration does not support "unsupported"')
    expect(() => assertElementHtml(42)).toThrow(
      'Program.makeElement requires an Html view',
    )
  })
})
