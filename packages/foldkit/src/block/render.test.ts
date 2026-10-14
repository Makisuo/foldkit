import { Effect, Layer, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import type { Html, HtmlBuilder } from '../html/index.js'
import { defineMessageUnion } from '../message/index.js'
import { define } from './define.js'
import { makeDefineRender } from './render.js'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value

const Model = Schema.Struct({ label: Schema.String })
type Model = typeof Model.Type

const Message = defineMessageUnion({ ClickedLabel: { label: Schema.String } })
type Message = typeof Message.Type

const ForeignMessage = defineMessageUnion({ ClickedForeign: {} })

type ViewRequirements = Readonly<{ RenderRequirement: 'RenderRequirement' }>
type ViewBuilder = HtmlBuilder<Message, ViewRequirements>

const render = makeDefineRender<Model, Message, ViewRequirements>()

const modelRender = render((model, h) =>
  h.button(
    [h.OnClick(Message.ClickedLabel({ label: model.label }))],
    [model.label],
  ),
)

const builderRender = render.builder(h => h.header([], ['Heading']))

type Card = Readonly<{ label: string; value: string }>

const inputRender = render.withInput<Card>()(({ label, value }, h) =>
  h.div([], [h.span([], [label]), h.span([], [value])]),
)

const arrayRender = render.withInput<ReadonlyArray<string>>()((labels, h) =>
  labels.map(label => h.span([], [label])),
)

const reusableDivider = <ReusableMessage, ReusableRequirements>(
  h: HtmlBuilder<ReusableMessage, ReusableRequirements>,
) => h.div([h.Class('divider')])

const reusableRender = render.builder(reusableDivider)

type ModelRenderParametersAreExact = Expect<
  Equal<Parameters<typeof modelRender>, [model: Model, h: ViewBuilder]>
>
type BuilderRenderParametersAreExact = Expect<
  Equal<Parameters<typeof builderRender>, [h: ViewBuilder]>
>
type InputRenderParametersAreExact = Expect<
  Equal<Parameters<typeof inputRender>, [input: Card, h: ViewBuilder]>
>
type ArrayRenderOutputIsHtmlArray = Expect<
  ReturnType<typeof arrayRender> extends ReadonlyArray<Html> ? true : false
>
type ReusableRenderParametersAreOwned = Expect<
  Equal<Parameters<typeof reusableRender>, [h: ViewBuilder]>
>

export type RenderAssertions = [
  ModelRenderParametersAreExact,
  BuilderRenderParametersAreExact,
  InputRenderParametersAreExact,
  ArrayRenderOutputIsHtmlArray,
  ReusableRenderParametersAreOwned,
]

const ChildModel = Schema.Struct({ value: Schema.String })
const ChildMessage = defineMessageUnion({ ClickedChild: {} })
const ChildDefinition = define('RenderHelperChild', {
  Model: ChildModel,
  Message: ChildMessage,
})
const ChildComposition = ChildDefinition.toComposition()
const childView = ChildComposition.view((model, h) => h.span([], [model.value]))
const childRender = ChildComposition.render((model, h) =>
  h.span([], [model.value]),
)
const childBlock = ChildComposition.toBlock({
  init: () => ({ model: ChildModel.make({ value: 'child' }) }),
  update: ChildDefinition.update(model => ({ model })),
  view: childView,
  EffectsLayer: Layer.empty,
})

const ParentModel = Schema.Struct({ child: ChildModel })
const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
  CompletedObserveParent: {},
})
const ParentDefinition = define('RenderHelperParent', {
  Model: ParentModel,
  Message: ParentMessage,
})
const ObserveParent = ParentDefinition.mount('ObserveParent', {
  messages: [ParentMessage.CompletedObserveParent],
  handler: function* () {
    return () => Effect.succeed(ParentMessage.CompletedObserveParent())
  },
})
const child = ParentDefinition.bindChild(childBlock, {
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})
const ParentComposition = ParentDefinition.toComposition({
  children: [child],
  mounts: [ObserveParent],
})
const parentRender = ParentComposition.render((model, h) =>
  h.div(
    [h.OnMount(ObserveParent())],
    [h.block(child.embedView({ slotId: 'child', model: model.child }))],
  ),
)
const OmittedParentComposition = ParentDefinition.toComposition()

type ParentRenderParametersAreExact = Expect<
  Equal<
    Parameters<typeof parentRender>,
    [
      model: typeof ParentModel.Type,
      h: import('./definition.js').HtmlBuilderOf<typeof ParentComposition>,
    ]
  >
>

export type CompositionRenderAssertions = [ParentRenderParametersAreExact]

if (false) {
  render((_model, h) =>
    h.button([
      // @ts-expect-error Owned render helpers accept only the Composition's Message.
      h.OnClick(ForeignMessage.ClickedForeign()),
    ]),
  )

  // @ts-expect-error Domain render helpers require a concrete input type.
  render.withInput()((_input, h) => h.empty)
  // @ts-expect-error any would erase the domain input contract.
  render.withInput<any>()((_input, h) => h.empty)
  // @ts-expect-error never cannot describe a usable domain input.
  render.withInput<never>()((_input, h) => h.empty)
  // @ts-expect-error void belongs to the builder-only helper shape.
  render.withInput<void>()((_input, h) => h.empty)
  // @ts-expect-error undefined belongs to the builder-only helper shape.
  render.withInput<undefined>()((_input, h) => h.empty)
  // @ts-expect-error Render helpers produce Html or arrays of Html.
  render.builder(() => 'text')

  OmittedParentComposition.render((_model, h) =>
    h.div([
      // @ts-expect-error The Mount is absent from this Composition.
      h.OnMount(ObserveParent()),
    ]),
  )

  OmittedParentComposition.render((model, h) =>
    h.block(
      // @ts-expect-error The child Binding is absent from this Composition.
      child.embedView({ slotId: 'child', model: model.child }),
    ),
  )

  ChildComposition.toBlock({
    init: () => ({ model: ChildModel.make({ value: 'child' }) }),
    update: ChildDefinition.update(model => ({ model })),
    // @ts-expect-error A plain render helper cannot complete a Block as its branded view.
    view: childRender,
    EffectsLayer: Layer.empty,
  })
}

describe('makeDefineRender', () => {
  it('returns each render callback unchanged', () => {
    const modelCallback = (_model: Model, h: ViewBuilder) => h.empty
    const builderCallback = (h: ViewBuilder) => h.empty
    const inputCallback = (_input: Card, h: ViewBuilder) => h.empty

    expect(render(modelCallback)).toBe(modelCallback)
    expect(render.builder(builderCallback)).toBe(builderCallback)
    expect(render.withInput<Card>()(inputCallback)).toBe(inputCallback)
    expect(reusableRender).toBe(reusableDivider)
  })
})
