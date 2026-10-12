import {
  Effect,
  Fiber,
  Layer,
  Option,
  Schema,
  type Scope,
  Stream,
} from 'effect'
import { afterEach, expect, it, vi } from 'vitest'

import * as ManagedResource from '../managedResource/index.js'
import { defineMessageUnion } from '../message/index.js'
import * as Mount from '../mount/index.js'
import * as Application from '../runtime/application.js'
import { __startProgram } from '../runtime/start.js'
import { modifyFields } from '../struct/index.js'
import * as Subscription from '../subscription/subscription.js'
import { owner } from './owner.js'

type LifecycleEvent =
  | 'Mount acquired'
  | 'Mount handler built'
  | 'Mount handler released'
  | 'Mount released'
  | 'ManagedResource acquired'
  | 'ManagedResource handler built'
  | 'ManagedResource handler released'
  | 'ManagedResource released'
  | 'Subscription handler built'
  | 'Subscription handler released'
  | 'Subscription started'
  | 'Subscription stopped'

const buildGraph = (events: Array<LifecycleEvent>) => {
  const trackHandler = (
    built: LifecycleEvent,
    released: LifecycleEvent,
  ): Effect.Effect<void, never, Scope.Scope> =>
    Effect.acquireRelease(
      Effect.sync(() => {
        events.push(built)
      }),
      () =>
        Effect.sync(() => {
          events.push(released)
        }),
    )

  const ChildOwner = owner('Lifecycle/Child')

  const ChildModel = Schema.Struct({ id: Schema.String })
  type ChildModel = typeof ChildModel.Type

  const ChildMessage = defineMessageUnion({
    AcquiredSession: {},
    CompletedObservePanel: {},
    FailedAcquireSession: {},
    ReleasedSession: {},
  })
  type ChildMessage = typeof ChildMessage.Type

  const Session = ManagedResource.tag<string>()('Lifecycle/Child/Session')

  const subscriptions = Subscription.make<ChildModel, ChildMessage>()(
    entry => ({
      activity: entry(ChildOwner.name('ObserveActivity'), {
        messages: [],
        handler: function* () {
          yield* trackHandler(
            'Subscription handler built',
            'Subscription handler released',
          )

          return () =>
            Stream.fromEffect(
              Effect.sync(() => {
                events.push('Subscription started')
              }),
            ).pipe(
              Stream.flatMap(() => Stream.never),
              Stream.ensuring(
                Effect.sync(() => {
                  events.push('Subscription stopped')
                }),
              ),
            )
        },
      }),
    }),
  )

  const managedResources = ManagedResource.make<ChildModel, ChildMessage>()(
    entry => ({
      session: entry(
        ChildOwner.name('ManageSession'),
        Schema.Option(Schema.Null),
        {
          resource: Session,
          modelToMaybeRequirements: () => Option.some(null),
          onAcquired: () => ChildMessage.AcquiredSession(),
          onReleased: () => ChildMessage.ReleasedSession(),
          onAcquireError: () => ChildMessage.FailedAcquireSession(),
          handler: function* () {
            yield* trackHandler(
              'ManagedResource handler built',
              'ManagedResource handler released',
            )

            return {
              acquire: () =>
                Effect.sync(() => {
                  events.push('ManagedResource acquired')
                  return 'session'
                }),
              release: () =>
                Effect.sync(() => {
                  events.push('ManagedResource released')
                }),
            }
          },
        },
      ),
    }),
  )

  const ObservePanel = Mount.define(ChildOwner.name('ObservePanel'), {
    messages: [ChildMessage.CompletedObservePanel],
    handler: function* () {
      yield* trackHandler('Mount handler built', 'Mount handler released')

      return () =>
        Effect.gen(function* () {
          yield* Effect.acquireRelease(
            Effect.sync(() => {
              events.push('Mount acquired')
            }),
            () =>
              Effect.sync(() => {
                events.push('Mount released')
              }),
          )

          return ChildMessage.CompletedObservePanel()
        })
    },
  })

  const childDefinition = ChildOwner.define({
    Model: ChildModel,
    Message: ChildMessage,
    mounts: [ObservePanel],
  })
  const childView = childDefinition.defineView((model, h) =>
    h.div([h.OnMount(ObservePanel())], [`child:${model.id}`]),
  )
  const Child = childDefinition.compose({
    view: childView,
    init: () => ({ model: ChildModel.make({ id: 'one' }) }),
    update: (model: ChildModel, message: ChildMessage) =>
      ChildMessage.match(message, {
        AcquiredSession: () => ({ model }),
        CompletedObservePanel: () => ({ model }),
        FailedAcquireSession: () => ({ model }),
        ReleasedSession: () => ({ model }),
      }),
    subscriptions,
    managedResources,
    EffectsLayer: Layer.mergeAll(
      subscriptions.activity.layer,
      managedResources.session.layer,
      ObservePanel.layer,
    ),
  })

  const ParentOwner = owner('Lifecycle/Parent')
  const ParentModel = Schema.Struct({
    maybeChild: Schema.Option(ChildModel),
  })
  type ParentModel = typeof ParentModel.Type
  const ParentMessage = defineMessageUnion({
    GotChildMessage: { message: ChildMessage },
    RemovedChild: {},
  })
  type ParentMessage = typeof ParentMessage.Type

  const child = Child.bind({
    placement: 'child',
    read: (model: ParentModel) => model.maybeChild,
    write: (model, nextChild) =>
      modifyFields(model, {
        maybeChild: () => Option.some(nextChild),
      }),
    toParentMessage: message => ParentMessage.GotChildMessage({ message }),
  })

  const parentDefinition = ParentOwner.define({
    Model: ParentModel,
    Message: ParentMessage,
    children: [child],
  })
  const parentView = parentDefinition.defineView((model, h) =>
    h.div(
      [],
      [
        h.button([h.OnClick(ParentMessage.RemovedChild())], ['remove child']),
        Option.match(model.maybeChild, {
          onNone: () => h.p([], ['child removed']),
          onSome: childModel =>
            h.submodel(
              child.embed({
                slotId: 'child',
                model: childModel,
              }),
            ),
        }),
      ],
    ),
  )
  const Parent = parentDefinition.compose({
    view: parentView,
    init: () => ({
      model: ParentModel.make({
        maybeChild: Option.some(Child.init().model),
      }),
    }),
    update: (model: ParentModel, message: ParentMessage) =>
      ParentMessage.match(message, {
        GotChildMessage: ({ message: childMessage }) =>
          child.fold(model, childMessage),
        RemovedChild: () => ({
          model: modifyFields(model, {
            maybeChild: () => Option.none(),
          }),
        }),
      }),
    EffectsLayer: Layer.empty,
  })

  return Parent
}

afterEach(() => {
  document.body.innerHTML = ''
})

it('keeps descriptor effects scoped to the application and child placement lifetimes', async () => {
  const events: Array<LifecycleEvent> = []
  const Parent = buildGraph(events)
  const container = document.createElement('div')
  container.id = 'submodel-lifecycle-test'
  document.body.appendChild(container)

  const application = Application.make({
    Model: Parent.Model,
    init: Parent.init,
    update: Parent.update,
    view: (model, h) => ({
      title: 'Submodel lifecycle test',
      body: Parent.view(model, h),
    }),
    subscriptions: Parent.subscriptions,
    managedResources: Parent.managedResources,
    mounts: Parent.mounts,
    container,
  })
  const provided = Application.provide(application, Parent.EffectsLayer)

  expect(events).toEqual([])

  const fiber = Effect.runFork(__startProgram(provided, undefined, 'Fresh'))

  try {
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('child:one')
      expect(events).toEqual(
        expect.arrayContaining([
          'Subscription handler built',
          'Subscription started',
          'ManagedResource handler built',
          'ManagedResource acquired',
          'Mount handler built',
          'Mount acquired',
        ]),
      )
    })

    expect(
      events.filter(event => event.endsWith('handler built')),
    ).toHaveLength(3)

    document.body.querySelector('button')?.click()

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('child removed')
      expect(events).toEqual(
        expect.arrayContaining([
          'Subscription stopped',
          'ManagedResource released',
          'Mount released',
        ]),
      )
    })

    expect(events.some(event => event.endsWith('handler released'))).toBe(false)
  } finally {
    await Effect.runPromise(Fiber.interrupt(fiber))
  }

  expect(events.filter(event => event.endsWith('handler released'))).toEqual(
    expect.arrayContaining([
      'Subscription handler released',
      'ManagedResource handler released',
      'Mount handler released',
    ]),
  )
  expect(
    events.filter(event => event.endsWith('handler released')),
  ).toHaveLength(3)
})
