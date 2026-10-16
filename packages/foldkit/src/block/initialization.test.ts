import { Context, Effect, Layer, Option, Predicate, Schema } from 'effect'
import { expect, expectTypeOf, it } from 'vitest'

import * as Command from '../command/index.js'
import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import type * as Update from '../update/index.js'
import { define } from './define.js'
import type { InitializationPlan } from './initialization.js'

class ChildClient extends Context.Service<
  ChildClient,
  Readonly<{ readonly label: string }>
>()('InitializationChildClient') {}

class ParentClient extends Context.Service<
  ParentClient,
  Readonly<{ readonly label: string }>
>()('InitializationParentClient') {}

const ChildModel = Schema.Struct({ count: Schema.Number })
type ChildModel = typeof ChildModel.Type

const ChildMessage = defineMessageUnion({
  CompletedInitialization: { count: Schema.Number },
  CompletedIncrement: {},
})
type ChildMessage = typeof ChildMessage.Type

const Child = define('InitializationChild', {
  Model: ChildModel,
  Message: ChildMessage,
})

const commandEffects = { child: 0, parent: 0 }
const FinishChildInitialization = Child.command('FinishInitialization', {
  args: { count: Schema.Number },
  messages: [ChildMessage.CompletedInitialization],
  handler: function* () {
    yield* ChildClient
    return ({ count }) =>
      Effect.sync(() => {
        commandEffects.child += 1
        return ChildMessage.CompletedInitialization({ count })
      })
  },
})
const FinishIncrement = Child.command('FinishIncrement', {
  messages: [ChildMessage.CompletedIncrement],
  handler: function* () {
    return () => Effect.succeed(ChildMessage.CompletedIncrement())
  },
})

const calls: globalThis.Array<string> = []
const single = (value: number): [number] => [value]
const increment = Child.step(model => {
  calls.push('child-step')
  return {
    model: modifyFields(model, { count: count => count + 100 }),
    commands: [FinishIncrement()],
  }
})
const ChildComposition = Child.toComposition()
const ChildBlock = ChildComposition.toBlock({
  init: ChildComposition.init((count: number) => {
    calls.push(`child-init-${count}`)
    return {
      model: ChildModel.make({ count }),
      commands: [FinishChildInitialization({ count })],
    }
  }),
  update: ChildComposition.update((model, message) =>
    ChildMessage.match(message, {
      CompletedInitialization: ({ count }) => ({
        model: modifyFields(model, { count: () => count }),
      }),
      CompletedIncrement: () => ({ model }),
    }),
  ),
  expose: { increment },
  EffectsLayer: Layer.merge(
    FinishChildInitialization.layer,
    FinishIncrement.layer,
  ),
})

const ParentModel = Schema.Struct({
  first: ChildModel,
  maybeSecond: Schema.Option(ChildModel),
  status: Schema.Literals(['Ready', 'Stepped']),
})
type ParentModel = typeof ParentModel.Type

const ParentMessage = defineMessageUnion({
  GotFirstMessage: { message: ChildMessage },
  GotSecondMessage: { message: ChildMessage },
  CompletedParentInitialization: {},
  CompletedParentStep: {},
})
type ParentMessage = typeof ParentMessage.Type

const Parent = define('InitializationParent', {
  Model: ParentModel,
  Message: ParentMessage,
})
const FinishParentInitialization = Parent.command('FinishInitialization', {
  messages: [ParentMessage.CompletedParentInitialization],
  handler: function* () {
    yield* ParentClient
    return () =>
      Effect.sync(() => {
        commandEffects.parent += 1
        return ParentMessage.CompletedParentInitialization()
      })
  },
})
const FinishParentStep = Parent.command('FinishStep', {
  messages: [ParentMessage.CompletedParentStep],
  handler: function* () {
    return () => Effect.succeed(ParentMessage.CompletedParentStep())
  },
})

type Startup = Readonly<{
  firstCount: number
  maybeSecondCount: Option.Option<number>
}>

const FirstBinding = Parent.bindChild(ChildBlock, {
  field: 'first',
  parentMessage: ParentMessage.GotFirstMessage,
  init: {
    args: (startup: Startup) => {
      calls.push('first-selector')
      return single(startup.firstCount)
    },
  },
})
const SecondBinding = Parent.bindChild(ChildBlock, {
  field: 'maybeSecond',
  parentMessage: ParentMessage.GotSecondMessage,
  init: {
    args: (startup: Startup) => {
      calls.push('second-selector')
      return Option.map(startup.maybeSecondCount, single)
    },
  },
})
const ParentComposition = Parent.toComposition({
  childBindings: [FirstBinding, SecondBinding],
})
const finishParentStep = Parent.step(model => {
  calls.push('parent-step')
  return {
    model: modifyFields(model, { status: () => 'Stepped' }),
    commands: [FinishParentStep()],
  }
})

const init = ParentComposition.init(
  (firstCount: number, maybeSecondCount: Option.Option<number>) => {
    calls.push('plan')
    return {
      startup: { firstCount, maybeSecondCount },
      model: { status: 'Ready' },
      commands: [FinishParentInitialization()],
      steps: [FirstBinding.increment(), finishParentStep],
    }
  },
)

it('preserves exact arguments, complete Model, requirements, and registration evidence', () => {
  const initializeFirst = () =>
    FirstBinding.init({
      args: [1],
      toParentModel: first =>
        ParentModel.make({
          first,
          maybeSecond: Option.none(),
          status: 'Ready',
        }),
    })
  const initializeSecond = () =>
    SecondBinding.init({
      args: [2],
      toParentModel: second =>
        ParentModel.make({
          first: ChildModel.make({ count: 1 }),
          maybeSecond: Option.some(second),
          status: 'Ready',
        }),
    })
  type ExpectedRequirements =
    | Update.RequirementsOf<typeof initializeFirst>
    | Update.RequirementsOf<typeof initializeSecond>
    | Command.HandlerOf<typeof FinishParentInitialization>
    | Update.RequirementsOf<ReturnType<typeof FirstBinding.increment>>
    | Command.HandlerOf<typeof FinishParentStep>
  type ExpectedRegistration =
    | Update.RegistrationEvidenceOf<ReturnType<typeof initializeFirst>>
    | Update.RegistrationEvidenceOf<ReturnType<typeof initializeSecond>>
    | Update.RegistrationEvidenceOf<
        ReturnType<ReturnType<typeof FirstBinding.increment>>
      >

  expectTypeOf<Parameters<typeof init>>().toEqualTypeOf<
    [firstCount: number, maybeSecondCount: Option.Option<number>]
  >()
  expectTypeOf<ReturnType<typeof init>['model']>().toEqualTypeOf<ParentModel>()
  expectTypeOf<
    Update.RequirementsOf<typeof init>
  >().toEqualTypeOf<ExpectedRequirements>()
  expectTypeOf<
    Update.RegistrationEvidenceOf<ReturnType<typeof init>>
  >().toEqualTypeOf<ExpectedRegistration>()
})

it('stays passive, initializes in Binding order, applies Steps sequentially, and does not execute effects', () => {
  calls.splice(0)
  commandEffects.child = 0
  commandEffects.parent = 0

  expect(calls).toEqual([])

  const initialized = init(1, Option.some(2))

  expect(calls).toEqual([
    'plan',
    'first-selector',
    'second-selector',
    'child-init-1',
    'child-init-2',
    'child-step',
    'parent-step',
  ])
  expect(initialized.model).toEqual({
    first: { count: 101 },
    maybeSecond: Option.some({ count: 2 }),
    status: 'Stepped',
  })
  expect(initialized.commands?.map(command => command.name)).toEqual([
    'InitializationParent/FinishInitialization',
    'first/FinishInitialization',
    'maybeSecond/FinishInitialization',
    'first/FinishIncrement',
    'InitializationParent/FinishStep',
  ])
  expect(commandEffects).toEqual({ child: 0, parent: 0 })
})

it('skips an optional child and drops its init Commands after a Step removes it', () => {
  const initializeAbsent = ParentComposition.init(() => ({
    startup: {
      firstCount: 3,
      maybeSecondCount: Option.none<number>(),
    },
    model: { status: 'Ready' },
  }))
  const initializeThenRemove = ParentComposition.init(() => ({
    startup: {
      firstCount: 3,
      maybeSecondCount: Option.some(4),
    },
    model: { status: 'Ready' },
    steps: [
      (model: ParentModel) => ({
        model: modifyFields(model, {
          maybeSecond: () => Option.none(),
        }),
      }),
    ],
  }))

  expect(initializeAbsent().model.maybeSecond).toEqual(Option.none())
  expect(initializeAbsent().commands?.map(command => command.name)).toEqual([
    'first/FinishInitialization',
  ])
  expect(initializeThenRemove().commands?.map(command => command.name)).toEqual(
    ['first/FinishInitialization'],
  )
})

it('preserves default and rest parameters for a graphless Composition', () => {
  const PlainModel = Schema.Struct({ count: Schema.Number })
  const Plain = define('InitializationPlain', {
    Model: PlainModel,
    Message: Schema.Never,
  })
  const PlainComposition = Plain.toComposition()
  const plainInit = PlainComposition.init(
    (count = 0, ...increments: ReadonlyArray<number>) => ({
      model: {
        count: increments.reduce(
          (total, increment) => total + increment,
          count,
        ),
      },
    }),
  )
  const restInit = PlainComposition.init(
    (...increments: ReadonlyArray<number>) => ({
      model: {
        count: increments.reduce((total, increment) => total + increment, 0),
      },
    }),
  )

  expectTypeOf<Parameters<typeof plainInit>>().toEqualTypeOf<
    [count?: number | undefined, ...increments: Array<number>]
  >()
  expectTypeOf<Parameters<typeof restInit>>().toEqualTypeOf<Array<number>>()
  expect(plainInit(1, 2, 3).model).toEqual({ count: 6 })
  expect(restInit(1, 2, 3).model).toEqual({ count: 6 })
})

it('preserves primitive and tagged union Models for graphless Compositions', () => {
  const Text = define('InitializationText', {
    Model: Schema.String,
    Message: Schema.Never,
  })
  const TextComposition = Text.toComposition()
  const initializeText = TextComposition.init(() => ({ model: 'ready' }))
  const SessionModel = Schema.Union([
    Schema.TaggedStruct('SignedOut', {}),
    Schema.TaggedStruct('SignedIn', { username: Schema.String }),
  ])
  const Session = define('InitializationSession', {
    Model: SessionModel,
    Message: Schema.Never,
  })
  const SessionComposition = Session.toComposition()
  const initializeSession = SessionComposition.init((username: string) => ({
    model: { _tag: 'SignedIn', username },
  }))

  expectTypeOf<
    ReturnType<typeof initializeText>['model']
  >().toEqualTypeOf<string>()
  expectTypeOf<ReturnType<typeof initializeSession>['model']>().toEqualTypeOf<{
    _tag: 'SignedIn'
    username: string
  }>()
  expect(initializeText().model).toBe('ready')
  expect(initializeSession('Ada').model).toEqual({
    _tag: 'SignedIn',
    username: 'Ada',
  })
})

it('preserves literals without Steps and widens initializers that can apply Steps', () => {
  const ChoiceModel = Schema.Struct({
    choice: Schema.Literals(['One', 'Two']),
  })
  type ChoiceModel = typeof ChoiceModel.Type
  const Choice = define('InitializationChoice', {
    Model: ChoiceModel,
    Message: Schema.Never,
  })
  const ChoiceComposition = Choice.toComposition()
  const withoutSteps = ChoiceComposition.init(() => ({
    model: { choice: 'One' },
  }))
  const withOptionalSteps = ChoiceComposition.init(
    (step?: Update.Step<ChoiceModel, never>) => ({
      model: { choice: 'One' },
      steps: step === undefined ? undefined : [step],
    }),
  )
  const optionalStepsArguments = (step?: Update.Step<ChoiceModel, never>) =>
    step

  expectTypeOf<
    ReturnType<typeof withoutSteps>['model']['choice']
  >().toEqualTypeOf<'One'>()
  expectTypeOf<
    ReturnType<typeof withOptionalSteps>['model']
  >().toEqualTypeOf<ChoiceModel>()
  expectTypeOf<Parameters<typeof withOptionalSteps>>().toEqualTypeOf<
    Parameters<typeof optionalStepsArguments>
  >()
})

it('rejects parent-owned values for child-initialized fields before child init', () => {
  const unsafeInit = Reflect.apply(ParentComposition.init, undefined, [
    () => ({
      startup: {
        firstCount: 1,
        maybeSecondCount: Option.none<number>(),
      },
      model: {
        first: ChildModel.make({ count: 99 }),
        status: 'Ready',
      },
    }),
  ])
  if (!Predicate.isFunction(unsafeInit)) {
    throw new Error('Expected Composition.init to return an initializer.')
  }

  calls.splice(0)
  expect(() => Reflect.apply(unsafeInit, undefined, [])).toThrow(
    'parent-owned model cannot supply child-initialized field "first"',
  )
  expect(calls).not.toContain('child-init-1')
})

it('rejects OutMessages from unsafe initialization plans and Steps', () => {
  const unsafePlanInit = Reflect.apply(ParentComposition.init, undefined, [
    () => ({
      startup: {
        firstCount: 1,
        maybeSecondCount: Option.none<number>(),
      },
      model: { status: 'Ready' },
      outMessage: { _tag: 'IgnoredPlanOutMessage' },
    }),
  ])
  const unsafeStepInit = Reflect.apply(ParentComposition.init, undefined, [
    () => ({
      startup: {
        firstCount: 1,
        maybeSecondCount: Option.none<number>(),
      },
      model: { status: 'Ready' },
      steps: [
        (model: ParentModel) => ({
          model,
          outMessage: { _tag: 'IgnoredStepOutMessage' },
        }),
      ],
    }),
  ])
  if (
    !Predicate.isFunction(unsafePlanInit) ||
    !Predicate.isFunction(unsafeStepInit)
  ) {
    throw new Error('Expected Composition.init to return initializers.')
  }

  expect(() => Reflect.apply(unsafePlanInit, undefined, [])).toThrow(
    'Composition.init callback cannot return an OutMessage',
  )
  expect(() => Reflect.apply(unsafeStepInit, undefined, [])).toThrow(
    'Composition.init Step cannot return an OutMessage',
  )
})

it('initializes a projected accessor child and verifies Schema reconstruction', () => {
  const AccessorParentModel = Schema.Struct({
    first: ChildModel,
    second: ChildModel,
    selected: Schema.Literal('Second'),
  })
  const AccessorParent = define('InitializationAccessorParent', {
    Model: AccessorParentModel,
    Message: ParentMessage,
  })
  const AccessorBinding = AccessorParent.bindChild(ChildBlock, {
    placement: 'selectedChild',
    read: (model: typeof AccessorParentModel.Type) => Option.some(model.second),
    write: (model, nextSecond) =>
      modifyFields(model, { second: () => nextSecond }),
    toParentMessage: message => ParentMessage.GotSecondMessage({ message }),
    fromParentMessage: false,
    init: {
      args: () => single(7),
      model: second => ({ second }),
    },
  })
  const AccessorComposition = AccessorParent.toComposition({
    childBindings: [AccessorBinding],
  })
  const initializeAccessor = AccessorComposition.init(() => ({
    model: {
      first: ChildModel.make({ count: 1 }),
      selected: 'Second',
    },
  }))

  expect(initializeAccessor().model).toEqual({
    first: { count: 1 },
    second: { count: 7 },
    selected: 'Second',
  })
})

it('rejects a projected field that the accessor does not select', () => {
  const AccessorParentModel = Schema.Struct({
    first: ChildModel,
    second: ChildModel,
  })
  const AccessorParent = define('InitializationInvalidAccessorParent', {
    Model: AccessorParentModel,
    Message: ParentMessage,
  })
  const InvalidAccessorBinding = AccessorParent.bindChild(ChildBlock, {
    placement: 'invalidSelectedChild',
    read: (model: typeof AccessorParentModel.Type) => Option.some(model.first),
    write: (model, nextFirst) =>
      modifyFields(model, { first: () => nextFirst }),
    toParentMessage: message => ParentMessage.GotFirstMessage({ message }),
    fromParentMessage: false,
    init: {
      args: () => single(7),
      model: second => ({ second }),
    },
  })
  const InvalidAccessorComposition = AccessorParent.toComposition({
    childBindings: [InvalidAccessorBinding],
  })
  const initializeInvalidAccessor = InvalidAccessorComposition.init(() => ({
    model: { first: ChildModel.make({ count: 7 }) },
  }))

  expect(() => initializeInvalidAccessor()).toThrow(
    'must select the exact initialized child before constructing the parent Model',
  )
})

it('runs initialization callbacks and Steps under the exact registered operation graph', () => {
  const toForeignParentModel = (first: ChildModel): ParentModel =>
    ParentModel.make({
      first,
      maybeSecond: Option.none(),
      status: 'Ready',
    })
  const ForeignBinding = Parent.bindChild(ChildBlock, {
    field: 'first',
    placement: 'foreignFirst',
    parentMessage: ParentMessage.GotFirstMessage,
  })
  const SelectorBinding = Parent.bindChild(ChildBlock, {
    field: 'first',
    placement: 'selectorFirst',
    parentMessage: ParentMessage.GotFirstMessage,
    init: {
      args: () => {
        ForeignBinding.init({
          args: [1],
          toParentModel: toForeignParentModel,
        })
        return single(1)
      },
    },
  })
  const SelectorComposition = Parent.toComposition({
    childBindings: [SelectorBinding],
  })
  const ProjectedParentModel = Schema.Struct({
    first: ChildModel,
    second: ChildModel,
  })
  const ProjectedParent = define('InitializationProjectedGraphParent', {
    Model: ProjectedParentModel,
    Message: ParentMessage,
  })
  const ForeignProjectedBinding = ProjectedParent.bindChild(ChildBlock, {
    field: 'first',
    placement: 'foreignProjectedFirst',
    parentMessage: ParentMessage.GotFirstMessage,
  })
  const ProjectedBinding = ProjectedParent.bindChild(ChildBlock, {
    placement: 'projectedSecond',
    read: (model: typeof ProjectedParentModel.Type) =>
      Option.some(model.second),
    write: (model, nextSecond) =>
      modifyFields(model, { second: () => nextSecond }),
    toParentMessage: message => ParentMessage.GotSecondMessage({ message }),
    fromParentMessage: false,
    init: {
      args: () => single(1),
      model: second => {
        ForeignProjectedBinding.init({
          args: [1],
          toParentModel: first => ProjectedParentModel.make({ first, second }),
        })
        return { second }
      },
    },
  })
  const ProjectedComposition = ProjectedParent.toComposition({
    childBindings: [ProjectedBinding],
  })
  const initializeWithForeignStep = ParentComposition.init(() => ({
    startup: {
      firstCount: 1,
      maybeSecondCount: Option.none<number>(),
    },
    model: { status: 'Ready' },
    steps: [ForeignBinding.increment()],
  }))
  const initializeWithForeignInit = ParentComposition.init(() => {
    ForeignBinding.init({
      args: [1],
      toParentModel: toForeignParentModel,
    })
    return {
      startup: {
        firstCount: 1,
        maybeSecondCount: Option.none<number>(),
      },
      model: { status: 'Ready' },
    }
  })
  const initializeWithForeignSelector = SelectorComposition.init(() => ({
    model: {
      maybeSecond: Option.none(),
      status: 'Ready',
    },
  }))
  const initializeWithForeignProjection = ProjectedComposition.init(() => ({
    model: { first: ChildModel.make({ count: 0 }) },
  }))

  expect(() => initializeWithForeignStep()).toThrow(
    'is not registered in the current Block graph',
  )
  expect(() => initializeWithForeignInit()).toThrow(
    'is not registered in the current Block graph',
  )
  expect(() => initializeWithForeignSelector()).toThrow(
    'is not registered in the current Block graph',
  )
  expect(() => initializeWithForeignProjection()).toThrow(
    'is not registered in the current Block graph',
  )
})

if (false) {
  // @ts-expect-error Child-dependent startup selectors require shared startup.
  ParentComposition.init(() => ({ model: { status: 'Ready' } }))

  ParentComposition.init(() => ({
    startup: { firstCount: 1, maybeSecondCount: Option.none<number>() },
    // @ts-expect-error Initialized child fields are owned by the Composition.
    model: { first: ChildModel.make({ count: 1 }), status: 'Ready' },
  }))

  ParentComposition.init(() => ({
    startup: { firstCount: 1, maybeSecondCount: Option.none<number>() },
    model: { status: 'Ready' },
    // @ts-expect-error Startup Steps cannot emit an OutMessage.
    steps: [(model: ParentModel) => ({ model, outMessage: 'ignored' })],
  }))

  function overloadedInit(value: string): Readonly<{ model: ParentModel }>
  function overloadedInit(value: number): Readonly<{ model: ParentModel }>
  function overloadedInit(
    _value: string | number,
  ): Readonly<{ model: ParentModel }> {
    return {
      model: ParentModel.make({
        first: ChildModel.make({ count: 0 }),
        maybeSecond: Option.none(),
        status: 'Ready',
      }),
    }
  }

  // @ts-expect-error Composition initializers require a plain function with one concrete call signature.
  Parent.toComposition().init(overloadedInit)

  const genericInit = <Value extends number>(value: Value) => ({
    model: ParentModel.make({
      first: ChildModel.make({ count: 0 }),
      maybeSecond: Option.none(),
      status: 'Ready',
    }),
    value,
  })
  const callableMetadataInit = Object.assign(
    () => ({
      model: ParentModel.make({
        first: ChildModel.make({ count: 0 }),
        maybeSecond: Option.none(),
        status: 'Ready',
      }),
    }),
    { description: 'Initial parent Model' },
  )
  const optionalMetadataInit: (() => Readonly<{ model: ParentModel }>) &
    Readonly<{ description?: string }> = () => ({
    model: ParentModel.make({
      first: ChildModel.make({ count: 0 }),
      maybeSecond: Option.none(),
      status: 'Ready',
    }),
  })

  // @ts-expect-error Composition initializers require a plain function with one concrete call signature.
  Parent.toComposition().init(genericInit)
  // @ts-expect-error Composition initializers require a plain function with one concrete call signature.
  Parent.toComposition().init(callableMetadataInit)
  // @ts-expect-error Optional callable metadata still requires a plain adapter callback.
  Parent.toComposition().init(optionalMetadataInit)

  type NeverRestPlan = InitializationPlan<
    ParentModel,
    ParentMessage,
    readonly []
  >
  const neverRestMetadataInit = Object.assign(
    (..._args: never): NeverRestPlan => ({
      model: ParentModel.make({
        first: ChildModel.make({ count: 0 }),
        maybeSecond: Option.none(),
        status: 'Ready',
      }),
    }),
    { description: 'Initial parent Model' },
  )
  const neverRestInit = (..._args: never): NeverRestPlan => ({
    model: ParentModel.make({
      first: ChildModel.make({ count: 0 }),
      maybeSecond: Option.none(),
      status: 'Ready',
    }),
  })
  function neverRestOverloadedInit(
    value: boolean,
  ): Readonly<{ model: ChildModel }>
  function neverRestOverloadedInit(...args: never): NeverRestPlan
  function neverRestOverloadedInit(
    value?: boolean,
  ): NeverRestPlan | Readonly<{ model: ChildModel }> {
    if (value === true) {
      return { model: ChildModel.make({ count: 0 }) }
    }

    return {
      model: ParentModel.make({
        first: ChildModel.make({ count: 0 }),
        maybeSecond: Option.none(),
        status: 'Ready',
      }),
    }
  }
  const neverRestGenericInit = <Value>(
    ..._args: never & ReadonlyArray<Value>
  ): NeverRestPlan => ({
    model: ParentModel.make({
      first: ChildModel.make({ count: 0 }),
      maybeSecond: Option.none(),
      status: 'Ready',
    }),
  })

  // @ts-expect-error Callable metadata cannot use the uninferred signature sentinel.
  Parent.toComposition().init(neverRestMetadataInit)
  // @ts-expect-error A never-rest function is not callable by consumers.
  Parent.toComposition().init(neverRestInit)
  // @ts-expect-error Earlier overloads cannot use the uninferred signature sentinel.
  Parent.toComposition().init(neverRestOverloadedInit)
  // @ts-expect-error A never-rest generic is not callable by consumers.
  Parent.toComposition().init(neverRestGenericInit)
}

it('omits startup when every child selector has no input', () => {
  const ConstantStartupParent = define('ConstantStartupParent', {
    Model: ParentModel,
    Message: ParentMessage,
  })
  const FirstBinding = ConstantStartupParent.bindChild(ChildBlock, {
    field: 'first',
    parentMessage: ParentMessage.GotFirstMessage,
    init: { args: () => [3] },
  })
  const SecondBinding = ConstantStartupParent.bindChild(ChildBlock, {
    field: 'maybeSecond',
    parentMessage: ParentMessage.GotSecondMessage,
    init: { args: () => Option.some([4]) },
  })
  const ConstantStartupParentComposition = ConstantStartupParent.toComposition({
    childBindings: [FirstBinding, SecondBinding],
  })
  const init = ConstantStartupParentComposition.init(() => ({
    model: { status: 'Ready' },
  }))
  const parentInit = init()

  expectTypeOf(init).parameters.toEqualTypeOf<[]>()
  expect(parentInit.model.first.count).toBe(3)
  expect(Option.getOrThrow(parentInit.model.maybeSecond).count).toBe(4)
  expect(parentInit.commands).toHaveLength(2)
})
