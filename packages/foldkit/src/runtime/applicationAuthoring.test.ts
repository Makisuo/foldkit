import { Context, Effect, Layer, Option, Schema } from 'effect'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest'

import { define } from '../block/define.js'
import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import type { Url } from '../url/index.js'
import type {
  Application as ApplicationProgram,
  Element as ElementProgram,
  ViewBuilderFor,
} from './applicationPublic.js'
import { define as defineApplication } from './applicationPublic.js'
import * as ModelPreservationBridge from './modelPreservationBridge.js'
import { embed } from './start.js'

class ValueSource extends Context.Service<
  ValueSource,
  Readonly<{ value: string }>
>()('ApplicationAuthoring/ValueSource') {}

const Child = define('ApplicationAuthoringChild')
const ChildModel = Schema.Struct({ value: Schema.String })
const ChildMessage = defineMessageUnion({
  UpdatedChildValue: { value: Schema.String },
})
const child = Child.define({ Model: ChildModel, Message: ChildMessage })
const ChildComposition = child.toComposition()
const childBlock = ChildComposition.toBlock({
  init: () => ({ model: { value: 'child' } }),
  update: child.update((model, { value }) => ({
    model: modifyFields(model, { value: () => value }),
  })),
  view: ChildComposition.view((model, h) => h.span([], [model.value])),
})

const Model = Schema.Struct({
  rootValue: Schema.String,
  child: ChildModel,
})
const Message = defineMessageUnion({
  ClickedReadRootValue: {},
  CompletedReadRootValue: { value: Schema.String },
  GotChildMessage: { message: ChildMessage },
})
const ForeignMessage = defineMessageUnion({ ForeignCompleted: {} })
const Application = defineApplication({ Model, Message })
const graphlessComposition = Application.toComposition()
const ReadRootValue = Application.command('ReadRootValue', {
  messages: [Message.CompletedReadRootValue],
  handler: function* () {
    const source = yield* ValueSource

    return () =>
      Effect.succeed(Message.CompletedReadRootValue({ value: source.value }))
  },
})
const documentView = graphlessComposition.view((model, h) => ({
  title: model.rootValue,
  body: h.div([], [model.rootValue]),
}))
const graphlessElementView = graphlessComposition.view((model, h) =>
  h.div([], [model.rootValue]),
)
const ObserveRoot = Application.mount('ObserveRoot', {
  messages: [Message.CompletedReadRootValue],
  handler: function* () {
    return () =>
      Effect.succeed(Message.CompletedReadRootValue({ value: 'mounted' }))
  },
})
const mountedComposition = Application.toComposition({ mounts: [ObserveRoot] })
const mountedView = mountedComposition.view((model, h) =>
  h.div([h.OnMount(ObserveRoot())], [model.rootValue]),
)
const childBinding = Application.bindChild(childBlock, {
  read: model => Option.some(model.child),
  write: (model, nextChild) => modifyFields(model, { child: () => nextChild }),
  parentMessage: Message.GotChildMessage,
})
const composition = Application.toComposition({ children: [childBinding] })
const initSource = () => {
  const childInit = childBinding.init()

  return {
    model: { rootValue: 'pending', child: childInit.model },
  }
}
const init = Application.init(initSource)
const update = Application.update((model, message) =>
  Message.match(message, {
    ClickedReadRootValue: () => ({
      model,
      commands: [ReadRootValue()],
    }),
    CompletedReadRootValue: ({ value }) => ({
      model: modifyFields(model, { rootValue: () => value }),
    }),
    GotChildMessage: () => ({ model }),
  }),
)
const rootBody = (
  model: typeof Model.Type,
  h: ViewBuilderFor<typeof composition>,
) =>
  h.div(
    [],
    [
      h.button([h.OnClick(Message.ClickedReadRootValue())], [model.rootValue]),
      h.block(
        childBinding.embedView({
          slotId: 'child',
          model: model.child,
        }),
      ),
    ],
  )
const view = composition.view(rootBody)

const NoMessageModel = Schema.Null
const NoMessageApplication = defineApplication({
  Model: NoMessageModel,
  Message: Schema.Never,
})
const NoMessageComposition = NoMessageApplication.toComposition()
const noMessageInit = () => ({ model: null })
const noMessageUpdate = NoMessageApplication.update(model => ({ model }))
const noMessageDocumentView = NoMessageComposition.view((_model, h) => ({
  title: 'No messages',
  body: h.empty,
}))
const noMessageElementView = NoMessageComposition.view((_model, h) => h.empty)

const typecheckRootCompletion = (): void => {
  // @ts-expect-error An Application Definition does not author the primary view.
  Application.view
  // @ts-expect-error An Application Composition does not expose the Definition-only init helper.
  composition.init

  Application.command('AcceptedCommand', {
    messages: [Message.CompletedReadRootValue],
  })
  Application.mount('AcceptedMount', {
    messages: [Message.CompletedReadRootValue],
  })
  Application.mountStream('AcceptedMountStream', {
    messages: [Message.CompletedReadRootValue],
  })

  Application.command('ForeignCommand', {
    // @ts-expect-error Root Commands must produce the Application Message.
    messages: [ForeignMessage.ForeignCompleted],
  })
  Application.mount('ForeignMount', {
    // @ts-expect-error Root Mounts must produce the Application Message.
    messages: [ForeignMessage.ForeignCompleted],
  })
  Application.mountStream('ForeignMountStream', {
    // @ts-expect-error Root stream Mounts must produce the Application Message.
    messages: [ForeignMessage.ForeignCompleted],
  })
  composition.command('RegisteredForeignCommand', {
    // @ts-expect-error Composition preserves the Application Message boundary.
    messages: [ForeignMessage.ForeignCompleted],
  })

  graphlessComposition.toElement({
    container: null,
    init,
    update,
    view: graphlessElementView,
    EffectsLayer: ReadRootValue.layer,
  })

  const application = composition.toApplication({
    container: null,
    init,
    update,
    view: documentView,
    EffectsLayer: ReadRootValue.layer,
  })
  const pendingApplication: ApplicationProgram<
    undefined,
    void,
    ValueSource,
    never,
    Layer.Success<typeof ReadRootValue.layer>
  > = application
  void pendingApplication

  NoMessageComposition.toApplication({
    container: null,
    init: noMessageInit,
    update: noMessageUpdate,
    view: noMessageDocumentView,
  })
  NoMessageComposition.toElement({
    container: null,
    init: noMessageInit,
    update: noMessageUpdate,
    view: noMessageElementView,
  })

  // @ts-expect-error toApplication requires the registered Document view.
  composition.toApplication({
    container: null,
    init,
    update,
    view,
    EffectsLayer: ReadRootValue.layer,
  })

  // @ts-expect-error toElement requires the registered Element view.
  composition.toElement({
    container: null,
    init,
    update,
    view: documentView,
    EffectsLayer: ReadRootValue.layer,
  })

  // @ts-expect-error The graphless Composition has not registered the child used by this view.
  Application.toComposition().toElement({
    container: null,
    init,
    update,
    view,
    EffectsLayer: ReadRootValue.layer,
  })

  // @ts-expect-error The graphless Composition has not registered the Mount used by this view.
  Application.toComposition().toElement({
    container: null,
    init,
    update,
    view: mountedView,
    EffectsLayer: Layer.merge(ReadRootValue.layer, ObserveRoot.layer),
  })

  // @ts-expect-error root handler definitions must be included in EffectsLayer.
  composition.toElement({
    container: null,
    init,
    update,
    view,
  })

  composition.toElement({
    // @ts-expect-error Model is established by defineApplication.
    Model,
    container: null,
    init,
    update,
    view,
    EffectsLayer: ReadRootValue.layer,
  })

  const Flags = Schema.Struct({ initialValue: Schema.String })
  const initWithFlags = (flags: typeof Flags.Type) => ({
    model: {
      rootValue: flags.initialValue,
      child: { value: 'child' },
    },
  })
  const elementWithFlags = composition.toElement({
    Flags,
    flags: Effect.succeed({ initialValue: 'from flags' }),
    container: null,
    init: initWithFlags,
    update,
    view,
    EffectsLayer: ReadRootValue.layer,
  })
  const pendingElementWithFlags: ElementProgram<
    undefined,
    ValueSource,
    never,
    Layer.Success<typeof ReadRootValue.layer>
  > = elementWithFlags
  void pendingElementWithFlags

  const routedImplementation = {
    init: (_url: Url) => init(),
    update,
    view: documentView,
    EffectsLayer: ReadRootValue.layer,
  }
  const routedApplication = composition.toApplication({
    ...routedImplementation,
    container: null,
    routing: {
      onUrlRequest: request => {
        void request
        return Message.ClickedReadRootValue()
      },
      onUrlChange: url => {
        void url
        return Message.ClickedReadRootValue()
      },
    },
    devTools: { Message, mode: 'TimeTravel' },
  })
  const pendingRoutedApplication: ApplicationProgram<
    undefined,
    void,
    ValueSource,
    never,
    Layer.Success<typeof ReadRootValue.layer>
  > = routedApplication
  void pendingRoutedApplication

  const routedFlagsImplementation = {
    init: (flags: typeof Flags.Type, _url: Url) => initWithFlags(flags),
    update,
    view: documentView,
    EffectsLayer: ReadRootValue.layer,
  }
  const routedFlagsApplication = composition.toApplication({
    ...routedFlagsImplementation,
    Flags,
    container: null,
    routing: {
      onUrlRequest: request => {
        void request
        return Message.ClickedReadRootValue()
      },
      onUrlChange: url => {
        void url
        return Message.ClickedReadRootValue()
      },
    },
  })
  const pendingRoutedFlagsApplication: ApplicationProgram<
    undefined,
    typeof Flags.Type,
    ValueSource,
    never,
    Layer.Success<typeof ReadRootValue.layer>
  > = routedFlagsApplication
  void pendingRoutedFlagsApplication

  // @ts-expect-error a Flags application init must receive its Flags.
  composition.toElement({
    Flags,
    flags: Effect.succeed({ initialValue: 'from flags' }),
    container: null,
    init,
    update,
    view,
    EffectsLayer: ReadRootValue.layer,
  })
}
void typecheckRootCompletion

beforeEach(() => {
  vi.spyOn(ModelPreservationBridge, 'resolvePreservedModel').mockReturnValue(
    Effect.succeed(undefined),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('Application authoring', () => {
  it('stages primitive authoring before composition', () => {
    expectTypeOf(Application.Model).toEqualTypeOf(Model)
    expectTypeOf(Application.Message).toEqualTypeOf(Message)
    expect(composition.command).toBe(Application.command)
    expect(composition.mount).toBe(Application.mount)
    expect(composition.mountStream).toBe(Application.mountStream)
    expect(composition.resource).toBe(Application.resource)
    expect(composition.update).toBe(Application.update)
    expect(composition.step).toBe(Application.step)
    expect(composition.subscriptions).toBe(Application.subscriptions)
    expect(composition.managedResources).toBe(Application.managedResources)
    expect(Application.init).toBeTypeOf('function')
    expect(init).toBe(initSource)
    expect(composition).not.toHaveProperty('init')
    expect(Application).not.toHaveProperty('view')
    expect(graphlessComposition).toHaveProperty('view')

    // @ts-expect-error an application root is not a reusable Block.
    void Application.bind
    // @ts-expect-error an Application composition does not expose Block completion.
    void composition.toBlock
    // @ts-expect-error an application can only be composed once.
    void composition.toComposition
  })

  it('completes an empty composition through its owned method', () => {
    expect(() =>
      NoMessageComposition.toElement({
        container: document.createElement('div'),
        init: noMessageInit,
        update: noMessageUpdate,
        view: noMessageElementView,
      }),
    ).not.toThrow()
  })

  it('completes the registered graph and provides only ordinary Services', async () => {
    const container = document.createElement('div')
    container.id = 'application-authoring'
    document.body.append(container)

    const element = composition.toElement({
      container,
      init,
      update,
      view,
      EffectsLayer: ReadRootValue.layer,
    })
    const pendingElement: ElementProgram<
      undefined,
      ValueSource,
      never,
      Layer.Success<typeof ReadRootValue.layer>
    > = element
    void pendingElement

    const runnable = element.provide(
      Layer.succeed(ValueSource, { value: 'provided' }),
    )
    const handle = embed(runnable)

    try {
      await vi.waitFor(() =>
        expect(document.body.textContent).toBe('pendingchild'),
      )
      document.querySelector('button')?.click()
      await vi.waitFor(() =>
        expect(document.body.textContent).toBe('providedchild'),
      )
    } finally {
      handle.dispose()
    }
  })
})
