import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import type { Html, HtmlBuilder } from '../html/index.js'
import { defineMessageUnion } from '../message/index.js'
import { define as defineApplication } from './applicationPublic.js'

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

const ApplicationDefinition = defineApplication({ Model, Message })
const ApplicationComposition = ApplicationDefinition.toComposition()

const modelRender = ApplicationComposition.render((model, h) =>
  h.button(
    [h.OnClick(Message.ClickedLabel({ label: model.label }))],
    [model.label],
  ),
)
const builderRender = ApplicationComposition.render.builder(h =>
  h.header([], ['Heading']),
)
const inputRender = ApplicationComposition.render.withInput<string>()(
  (label, h) => h.span([], [label]),
)
const arrayRender = ApplicationComposition.render.withInput<
  ReadonlyArray<string>
>()((labels, h) => labels.map(label => h.span([], [label])))

type ViewBuilder = HtmlBuilder<Message>
type ModelRenderParametersAreExact = Expect<
  Equal<Parameters<typeof modelRender>, [model: Model, h: ViewBuilder]>
>
type BuilderRenderParametersAreExact = Expect<
  Equal<Parameters<typeof builderRender>, [h: ViewBuilder]>
>
type InputRenderParametersAreExact = Expect<
  Equal<Parameters<typeof inputRender>, [input: string, h: ViewBuilder]>
>
type ArrayRenderOutputIsHtmlArray = Expect<
  ReturnType<typeof arrayRender> extends ReadonlyArray<Html> ? true : false
>

export type ApplicationRenderAssertions = [
  ModelRenderParametersAreExact,
  BuilderRenderParametersAreExact,
  InputRenderParametersAreExact,
  ArrayRenderOutputIsHtmlArray,
]

if (false) {
  const update = ApplicationDefinition.update(model => ({ model }))
  const init = () => ({ model: Model.make({ label: 'initial' }) })

  // @ts-expect-error A plain render helper cannot complete an Application as its branded view.
  ApplicationComposition.makeElement({
    container: null,
    init,
    update,
    view: modelRender,
  })
}

describe('Application Composition render', () => {
  it('returns each render callback unchanged', () => {
    const modelCallback = (_model: Model, h: ViewBuilder) => h.empty
    const builderCallback = (h: ViewBuilder) => h.empty
    const inputCallback = (_input: string, h: ViewBuilder) => h.empty

    expect(ApplicationComposition.render(modelCallback)).toBe(modelCallback)
    expect(ApplicationComposition.render.builder(builderCallback)).toBe(
      builderCallback,
    )
    expect(
      ApplicationComposition.render.withInput<string>()(inputCallback),
    ).toBe(inputCallback)
  })
})
