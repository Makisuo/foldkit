import {
  Context,
  Deferred,
  Effect,
  Layer,
  Option,
  Schema,
  Stream,
} from 'effect'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { define } from '../block/define.js'
import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import { define as defineApplication } from './applicationPublic.js'
import * as ModelPreservationBridge from './modelPreservationBridge.js'
import { embed, run } from './start.js'

class ValueSource extends Context.Service<
  ValueSource,
  Readonly<{ value: string }>
>()('ApplicationBlock/ValueSource') {}

const Child = define('RootChild')
const ChildModel = Schema.Struct({ label: Schema.String })
const ChildMessage = defineMessageUnion({
  CompletedReadValue: { value: Schema.String },
})
const ReadValue = Child.command('ReadValue', {
  messages: [ChildMessage.CompletedReadValue],
  handler: function* () {
    const source = yield* ValueSource

    return () =>
      Effect.succeed(ChildMessage.CompletedReadValue({ value: source.value }))
  },
})
const child = Child.define({ Model: ChildModel, Message: ChildMessage })
const childBlock = child.toComposition().toBlock({
  init: (label: string) => ({ model: { label }, commands: [ReadValue()] }),
  update: child.update((model, { value }) => ({
    model: modifyFields(model, { label: () => value }),
  })),
  view: child.view((model, h) => h.span([], [model.label])),
  EffectsLayer: ReadValue.layer,
})

const Model = Schema.Struct({ left: ChildModel, right: ChildModel })
const Message = defineMessageUnion({
  GotLeftMessage: { message: ChildMessage },
  GotRightMessage: { message: ChildMessage },
})
const Application = defineApplication({ Model, Message })
const left = Application.bindChild(childBlock, {
  placement: 'Left',
  read: (model: typeof Model.Type) => Option.some(model.left),
  write: (model, nextLeft) => modifyFields(model, { left: () => nextLeft }),
  parentMessage: Message.GotLeftMessage,
})
const right = Application.bindChild(childBlock, {
  placement: 'Right',
  read: (model: typeof Model.Type) => Option.some(model.right),
  write: (model, nextRight) => modifyFields(model, { right: () => nextRight }),
  parentMessage: Message.GotRightMessage,
})
const composition = Application.toComposition({ children: [left, right] })
const init = () => {
  const leftInit = left.init('left')
  const rightInit = right.init('right')
  return {
    model: { left: leftInit.model, right: rightInit.model },
    commands: [...(leftInit.commands ?? []), ...(rightInit.commands ?? [])],
  }
}
const update = Application.update((model, message) =>
  Message.match(message, {
    GotLeftMessage: ({ message }) => left.fold(model, message),
    GotRightMessage: ({ message }) => right.fold(model, message),
  }),
)
const view = composition.view((model, h) =>
  h.div(
    [],
    [
      h.block(left.embedView({ slotId: 'left', model: model.left })),
      h.block(right.embedView({ slotId: 'right', model: model.right })),
    ],
  ),
)

class HostDependency extends Context.Service<
  HostDependency,
  Readonly<{ value: string }>
>()('ApplicationBlock/HostDependency') {}

const HostChild = define('ApplicationHostChild')
const HostChildModel = Schema.Struct({ value: Schema.String })
const HostChildMessage = defineMessageUnion({
  CompletedReadHostValue: { value: Schema.String },
})
const ReadHostValue = HostChild.command('ReadHostValue', {
  messages: [HostChildMessage.CompletedReadHostValue],
})
const hostChildDefinition = HostChild.define({
  Model: HostChildModel,
  Message: HostChildMessage,
})
const unresolvedHostChild = hostChildDefinition.toComposition().toBlock({
  init: () => ({ model: { value: '' }, commands: [ReadHostValue()] }),
  update: hostChildDefinition.update((model, { value }) => ({
    model: modifyFields(model, { value: () => value }),
  })),
  view: hostChildDefinition.view((model, h) => h.span([], [model.value])),
  EffectsLayer: Layer.empty,
  hostHandlers: [ReadHostValue],
})
const resolvedHostChild = unresolvedHostChild.provideHandlers(
  ReadHostValue.toLayer(
    Effect.gen(function* () {
      const dependency = yield* HostDependency
      return () =>
        Effect.succeed(
          HostChildMessage.CompletedReadHostValue({ value: dependency.value }),
        )
    }),
  ),
)

const HostParentModel = Schema.Struct({ child: HostChildModel })
const HostParentMessage = defineMessageUnion({
  GotChildMessage: { message: HostChildMessage },
})
const hostParent = defineApplication({
  Model: HostParentModel,
  Message: HostParentMessage,
})
const unresolvedHostBinding = hostParent.bindChild(unresolvedHostChild, {
  read: (model: typeof HostParentModel.Type) => Option.some(model.child),
  write: (model, nextChild) => modifyFields(model, { child: () => nextChild }),
  parentMessage: HostParentMessage.GotChildMessage,
})
const resolvedHostBinding = hostParent.bindChild(resolvedHostChild, {
  read: (model: typeof HostParentModel.Type) => Option.some(model.child),
  write: (model, nextChild) => modifyFields(model, { child: () => nextChild }),
  parentMessage: HostParentMessage.GotChildMessage,
})
const unresolvedHostComposition = hostParent.toComposition({
  children: [unresolvedHostBinding],
})
const resolvedHostComposition = hostParent.toComposition({
  children: [resolvedHostBinding],
})
const unresolvedHostInit = () => ({
  model: { child: unresolvedHostBinding.init().model },
})
const resolvedHostInit = () => ({
  model: { child: resolvedHostBinding.init().model },
})
const unresolvedHostUpdate = hostParent.update((model, { message }) =>
  unresolvedHostBinding.fold(model, message),
)
const resolvedHostUpdate = hostParent.update((model, { message }) =>
  resolvedHostBinding.fold(model, message),
)
const unresolvedHostView = unresolvedHostComposition.view((model, h) =>
  h.div(
    [],
    [
      h.block(
        unresolvedHostBinding.embedView({
          slotId: 'host-child',
          model: model.child,
        }),
      ),
    ],
  ),
)
const resolvedHostView = resolvedHostComposition.view((model, h) =>
  h.div(
    [],
    [
      h.block(
        resolvedHostBinding.embedView({
          slotId: 'host-child',
          model: model.child,
        }),
      ),
    ],
  ),
)

beforeEach(() => {
  vi.spyOn(ModelPreservationBridge, 'resolvePreservedModel').mockReturnValue(
    Effect.succeed(undefined),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('registered Application composition completion', () => {
  it('includes child recipes and lifts initialization Commands through the real runtime', async () => {
    const container = document.createElement('div')
    container.id = 'composed-element'
    document.body.append(container)
    let acquisitions = 0
    let releases = 0
    const ServicesLayer = Layer.effect(
      ValueSource,
      Effect.acquireRelease(
        Effect.sync(() => {
          acquisitions += 1
          return { value: 'provided' }
        }),
        () =>
          Effect.sync(() => {
            releases += 1
          }),
      ),
    )
    const application = composition.makeElement({
      container,
      init,
      update,
      view,
      EffectsLayer: Layer.empty,
    })
    expect(init().model).toEqual({
      left: { label: 'left' },
      right: { label: 'right' },
    })
    const runnable = application.provide(ServicesLayer)
    const handle = embed(runnable)

    try {
      await vi.waitFor(() =>
        expect(document.body.textContent).toBe('providedprovided'),
      )
      expect(acquisitions).toBe(1)
    } finally {
      handle.dispose()
    }
    await vi.waitFor(() => expect(releases).toBe(1))
  })

  it('routes a leaf Command result through every composed Message wrapper with its leaf resource', async () => {
    const wrapperPath: Array<string> = []
    let resourceAcquisitions = 0
    const Leaf = define('NestedCommandLeaf')
    const LeafValue = Leaf.resource<string>()('Value')
    const LeafModel = Schema.Struct({ value: Schema.String })
    const LeafMessage = defineMessageUnion({
      ClickedReadValue: {},
      CompletedReadValue: { value: Schema.String },
      FailedReadValue: {},
      AcquiredValue: {},
      ReleasedValue: {},
      FailedAcquireValue: {},
    })
    const ReadLeafValue = Leaf.command('ReadLeafValue', {
      messages: [LeafMessage.CompletedReadValue, LeafMessage.FailedReadValue],
      handler: function* () {
        return () =>
          LeafValue.get.pipe(
            Effect.map(value => LeafMessage.CompletedReadValue({ value })),
            Effect.catch(() => Effect.succeed(LeafMessage.FailedReadValue())),
          )
      },
    })
    const leaf = Leaf.define({ Model: LeafModel, Message: LeafMessage })
    const leafManagedResources = leaf.managedResources(entry => ({
      value: entry('Value', Schema.Option(Schema.Null), {
        resource: LeafValue,
        modelToMaybeRequirements: () => Option.some(null),
        onAcquired: () => LeafMessage.AcquiredValue(),
        onReleased: () => LeafMessage.ReleasedValue(),
        onAcquireError: () => LeafMessage.FailedAcquireValue(),
        handler: function* () {
          return {
            acquire: () =>
              Effect.sync(() => {
                resourceAcquisitions += 1
                return 'leaf resource value'
              }),
            release: () => Effect.void,
          }
        },
      }),
    }))
    const leafBlock = leaf.toComposition().toBlock({
      init: () => ({ model: { value: 'pending' } }),
      update: leaf.update((model, message) =>
        LeafMessage.match(message, {
          ClickedReadValue: () => ({ model, commands: [ReadLeafValue()] }),
          CompletedReadValue: ({ value }) => ({
            model: modifyFields(model, { value: () => value }),
          }),
          FailedReadValue: () => ({ model }),
          AcquiredValue: () => ({ model }),
          ReleasedValue: () => ({ model }),
          FailedAcquireValue: () => ({ model }),
        }),
      ),
      view: leaf.view((model, h) =>
        h.div(
          [],
          [
            h.button(
              [
                h.Id('read-nested-leaf'),
                h.OnClick(LeafMessage.ClickedReadValue()),
              ],
              ['Read leaf'],
            ),
            h.span([h.Id('nested-leaf-value')], [model.value]),
          ],
        ),
      ),
      managedResources: leafManagedResources,
      EffectsLayer: Layer.merge(
        ReadLeafValue.layer,
        leafManagedResources.value.layer,
      ),
    })

    const Middle = define('NestedCommandMiddle')
    const MiddleModel = Schema.Struct({ leaf: LeafModel })
    const MiddleMessage = defineMessageUnion({
      GotLeafMessage: { message: LeafMessage },
    })
    const middle = Middle.define({
      Model: MiddleModel,
      Message: MiddleMessage,
    })
    const leafBinding = middle.bindChild(leafBlock, {
      read: model => Option.some(model.leaf),
      write: (model, nextLeaf) => modifyFields(model, { leaf: () => nextLeaf }),
      parentMessage: MiddleMessage.GotLeafMessage,
    })
    const middleComposition = middle.toComposition({ children: [leafBinding] })
    const middleBlock = middleComposition.toBlock({
      init: () => ({ model: { leaf: leafBinding.init().model } }),
      update: middle.update((model, { message }) => {
        if (message._tag === 'CompletedReadValue') {
          wrapperPath.push('Middle/GotLeafMessage')
        }

        return leafBinding.fold(model, message)
      }),
      view: middleComposition.view((model, h) =>
        h.block(
          leafBinding.embedView({
            slotId: 'nested-leaf',
            model: model.leaf,
          }),
        ),
      ),
      EffectsLayer: Layer.empty,
    })

    const RootModel = Schema.Struct({ middle: MiddleModel })
    const RootMessage = defineMessageUnion({
      GotMiddleMessage: { message: MiddleMessage },
    })
    const root = defineApplication({
      Model: RootModel,
      Message: RootMessage,
    })
    const middleBinding = root.bindChild(middleBlock, {
      read: model => Option.some(model.middle),
      write: (model, nextMiddle) =>
        modifyFields(model, { middle: () => nextMiddle }),
      parentMessage: RootMessage.GotMiddleMessage,
    })
    const nestedComposition = root.toComposition({ children: [middleBinding] })
    const nestedInit = () => ({
      model: { middle: middleBinding.init().model },
    })
    const nestedUpdate = root.update((model, { message }) => {
      if (
        message._tag === 'GotLeafMessage' &&
        message.message._tag === 'CompletedReadValue'
      ) {
        wrapperPath.push('Root/GotMiddleMessage')
      }

      return middleBinding.fold(model, message)
    })
    const nestedView = nestedComposition.view((model, h) =>
      h.block(
        middleBinding.embedView({
          slotId: 'nested-middle',
          model: model.middle,
        }),
      ),
    )
    const container = document.createElement('div')
    container.id = 'nested-command-root'
    document.body.append(container)
    const handle = embed(
      nestedComposition.makeElement({
        container,
        init: nestedInit,
        update: nestedUpdate,
        view: nestedView,
        EffectsLayer: Layer.empty,
      }),
    )

    try {
      await vi.waitFor(() => expect(resourceAcquisitions).toBe(1))
      document.getElementById('read-nested-leaf')?.click()
      await vi.waitFor(() =>
        expect(document.getElementById('nested-leaf-value')?.textContent).toBe(
          'leaf resource value',
        ),
      )
      expect(wrapperPath).toEqual([
        'Root/GotMiddleMessage',
        'Middle/GotLeafMessage',
      ])
    } finally {
      handle.dispose()
    }
  })

  it('keeps an application Service alive across optional child replacement', async () => {
    class SharedValue extends Context.Service<
      SharedValue,
      Readonly<{ value: string }>
    >()('ApplicationBlock/SharedValue') {}

    let serviceAcquisitions = 0
    let serviceReleases = 0
    const SharedValueLayer = Layer.effect(
      SharedValue,
      Effect.acquireRelease(
        Effect.sync(() => {
          serviceAcquisitions += 1
          return { value: `service-${serviceAcquisitions}` }
        }),
        () =>
          Effect.sync(() => {
            serviceReleases += 1
          }),
      ),
    )
    const ServiceChild = define('ServiceLifetimeChild')
    const ServiceChildModel = Schema.Struct({ value: Schema.String })
    const ServiceChildMessage = defineMessageUnion({
      CompletedReadSharedValue: { value: Schema.String },
    })
    const ReadSharedValue = ServiceChild.command('ReadSharedValue', {
      messages: [ServiceChildMessage.CompletedReadSharedValue],
      handler: function* () {
        const sharedValue = yield* SharedValue

        return () =>
          Effect.succeed(
            ServiceChildMessage.CompletedReadSharedValue({
              value: sharedValue.value,
            }),
          )
      },
    })
    const serviceChild = ServiceChild.define({
      Model: ServiceChildModel,
      Message: ServiceChildMessage,
    })
    const serviceChildBlock = serviceChild.toComposition().toBlock({
      init: () => ({
        model: { value: 'pending' },
        commands: [ReadSharedValue()],
      }),
      update: serviceChild.update((model, { value }) => ({
        model: modifyFields(model, { value: () => value }),
      })),
      view: serviceChild.view((model, h) =>
        h.span([h.Id('service-child-value')], [model.value]),
      ),
      EffectsLayer: ReadSharedValue.layer,
    })
    const ServiceRootModel = Schema.Struct({
      maybeChild: Schema.Option(ServiceChildModel),
    })
    const ServiceRootMessage = defineMessageUnion({
      GotServiceChildMessage: { message: ServiceChildMessage },
      ClickedRemoveServiceChild: {},
      ClickedAddServiceChild: {},
    })
    const serviceRoot = defineApplication({
      Model: ServiceRootModel,
      Message: ServiceRootMessage,
    })
    const serviceChildBinding = serviceRoot.bindChild(serviceChildBlock, {
      read: model => model.maybeChild,
      write: (model, nextChild) =>
        modifyFields(model, { maybeChild: () => Option.some(nextChild) }),
      parentMessage: ServiceRootMessage.GotServiceChildMessage,
    })
    const serviceComposition = serviceRoot.toComposition({
      children: [serviceChildBinding],
    })
    const serviceInit = () => {
      const childInit = serviceChildBinding.init()

      return {
        model: { maybeChild: Option.some(childInit.model) },
        commands: childInit.commands,
      }
    }
    const serviceUpdate = serviceRoot.update((model, message) =>
      ServiceRootMessage.match(message, {
        GotServiceChildMessage: ({ message }) =>
          serviceChildBinding.fold(model, message),
        ClickedRemoveServiceChild: () => ({
          model: modifyFields(model, {
            maybeChild: () => Option.none(),
          }),
        }),
        ClickedAddServiceChild: () => {
          const childInit = serviceChildBinding.init()

          return {
            model: modifyFields(model, {
              maybeChild: () => Option.some(childInit.model),
            }),
            commands: childInit.commands,
          }
        },
      }),
    )
    const serviceView = serviceComposition.view((model, h) =>
      h.div(
        [],
        [
          h.button(
            [
              h.Id('remove-service-child'),
              h.OnClick(ServiceRootMessage.ClickedRemoveServiceChild()),
            ],
            ['Remove'],
          ),
          h.button(
            [
              h.Id('add-service-child'),
              h.OnClick(ServiceRootMessage.ClickedAddServiceChild()),
            ],
            ['Add'],
          ),
          Option.match(model.maybeChild, {
            onNone: () => h.span([h.Id('service-child-absent')], ['absent']),
            onSome: childModel =>
              h.block(
                serviceChildBinding.embedView({
                  slotId: 'service-child',
                  model: childModel,
                }),
              ),
          }),
        ],
      ),
    )
    const container = document.createElement('div')
    container.id = 'service-lifetime-root'
    document.body.append(container)
    const handle = embed(
      serviceComposition
        .makeElement({
          container,
          init: serviceInit,
          update: serviceUpdate,
          view: serviceView,
          EffectsLayer: Layer.empty,
        })
        .provide(SharedValueLayer),
    )

    try {
      await vi.waitFor(() =>
        expect(
          document.getElementById('service-child-value')?.textContent,
        ).toBe('service-1'),
      )
      expect(serviceAcquisitions).toBe(1)
      expect(serviceReleases).toBe(0)

      document.getElementById('remove-service-child')?.click()
      await vi.waitFor(() =>
        expect(document.getElementById('service-child-absent')).not.toBeNull(),
      )
      expect(serviceAcquisitions).toBe(1)
      expect(serviceReleases).toBe(0)

      document.getElementById('add-service-child')?.click()
      await vi.waitFor(() =>
        expect(
          document.getElementById('service-child-value')?.textContent,
        ).toBe('service-1'),
      )
      expect(serviceAcquisitions).toBe(1)
      expect(serviceReleases).toBe(0)
    } finally {
      handle.dispose()
    }

    await vi.waitFor(() => expect(serviceReleases).toBe(1))
  })

  it('gives repeated child Mounts their current resource slots', async () => {
    const Feature = define('MountedResource')
    const ready = Deferred.makeUnsafe<void>()
    let acquisitions = 0
    const Value = Feature.resource<string>()('Value')
    const FeatureModel = Schema.Struct({ label: Schema.String })
    const FeatureMessage = defineMessageUnion({
      AcquiredValue: {},
      ReleasedValue: {},
      FailedAcquireValue: {},
      CompletedObserveValue: { value: Schema.String },
      FailedObserveValue: {},
    })
    const ObserveValue = Feature.mountStream('ObserveValue', {
      messages: [
        FeatureMessage.CompletedObserveValue,
        FeatureMessage.FailedObserveValue,
      ],
      handler: function* () {
        return () =>
          Stream.fromEffect(
            Deferred.await(ready).pipe(
              Effect.andThen(Value.get),
              Effect.map(value =>
                FeatureMessage.CompletedObserveValue({ value }),
              ),
              Effect.catch(() =>
                Effect.succeed(FeatureMessage.FailedObserveValue()),
              ),
            ),
          )
      },
    })
    const feature = Feature.define({
      Model: FeatureModel,
      Message: FeatureMessage,
    })
    const featureComposition = feature.toComposition({ mounts: [ObserveValue] })
    const managedResources = feature.managedResources(entry => ({
      value: entry(
        'Value',
        Schema.Option(Schema.Struct({ label: Schema.String })),
        {
          resource: Value,
          modelToMaybeRequirements: model =>
            Option.some({ label: model.label }),
          onAcquired: () => FeatureMessage.AcquiredValue(),
          onReleased: () => FeatureMessage.ReleasedValue(),
          onAcquireError: () => FeatureMessage.FailedAcquireValue(),
          handler: function* () {
            return {
              acquire: ({ label }) => Effect.succeed(label),
              release: () => Effect.void,
            }
          },
        },
      ),
    }))
    const featureBlock = featureComposition.toBlock({
      init: (label: string) => ({ model: { label } }),
      update: feature.update(model => ({ model })),
      view: featureComposition.view((model, h) =>
        h.div([h.OnMount(ObserveValue())], [model.label]),
      ),
      managedResources,
      EffectsLayer: Layer.merge(
        ObserveValue.layer,
        managedResources.value.layer,
      ),
    })
    const RootModel = Schema.Struct({ left: FeatureModel, right: FeatureModel })
    const RootMessage = defineMessageUnion({
      GotLeft: { message: FeatureMessage },
      GotRight: { message: FeatureMessage },
    })
    const root = defineApplication({
      Model: RootModel,
      Message: RootMessage,
    })
    const left = root.bindChild(featureBlock, {
      placement: 'Left',
      read: (model: typeof RootModel.Type) => Option.some(model.left),
      write: (model, nextLeft) => modifyFields(model, { left: () => nextLeft }),
      toParentMessage: message => RootMessage.GotLeft({ message }),
    })
    const right = root.bindChild(featureBlock, {
      placement: 'Right',
      read: (model: typeof RootModel.Type) => Option.some(model.right),
      write: (model, nextRight) =>
        modifyFields(model, { right: () => nextRight }),
      toParentMessage: message => RootMessage.GotRight({ message }),
    })
    const rootComposition = root.toComposition({ children: [left, right] })
    const seen: Array<string> = []
    const rootInit = () => ({
      model: {
        left: left.init('left').model,
        right: right.init('right').model,
      },
    })
    const rootUpdate = root.update((model, message) => {
      if (message.message._tag === 'AcquiredValue') {
        acquisitions += 1
        if (acquisitions === 2) {
          Deferred.doneUnsafe(ready, Effect.void)
        }
      }
      if (message.message._tag === 'CompletedObserveValue') {
        seen.push(`${message._tag}:${message.message.value}`)
      }
      return { model }
    })
    const rootView = rootComposition.view((model, h) =>
      h.div(
        [],
        [
          h.block(left.embedView({ slotId: 'left', model: model.left })),
          h.block(right.embedView({ slotId: 'right', model: model.right })),
        ],
      ),
    )
    const container = document.createElement('div')
    container.id = 'mounted-root'
    document.body.append(container)
    const handle = embed(
      rootComposition.makeElement({
        container,
        init: rootInit,
        update: rootUpdate,
        view: rootView,
        EffectsLayer: Layer.empty,
      }),
    )

    try {
      await vi.waitFor(() =>
        expect(document.body.textContent).toBe('leftright'),
      )
      await vi.waitFor(() => expect(seen).toContain('GotLeft:left'))
      await vi.waitFor(() => expect(seen).toContain('GotRight:right'))
    } finally {
      handle.dispose()
    }
  })
})

const checkAssemblyTypes = (container: HTMLElement) => {
  const application = composition.makeElement({
    container,
    init,
    update,
    view,
    EffectsLayer: Layer.empty,
  })
  // @ts-expect-error Shared Service requirements must be provided before running.
  run(application)
  // @ts-expect-error Application.make requires a Document view.
  composition.make({
    container,
    init,
    update,
    view,
    EffectsLayer: Layer.empty,
  })

  // @ts-expect-error Root completion requires inherited host handlers to be supplied first.
  unresolvedHostComposition.makeElement({
    container,
    init: unresolvedHostInit,
    update: unresolvedHostUpdate,
    view: unresolvedHostView,
    EffectsLayer: Layer.empty,
  })
  const hostApplication = resolvedHostComposition.makeElement({
    container,
    init: resolvedHostInit,
    update: resolvedHostUpdate,
    view: resolvedHostView,
    EffectsLayer: Layer.empty,
  })
  hostApplication.provide(Layer.succeed(HostDependency, { value: 'provided' }))
}
void checkAssemblyTypes
