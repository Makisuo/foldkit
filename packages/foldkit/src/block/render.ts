import type { Html, HtmlBuilder } from '../html/index.js'

type IsAny<Value> = 0 extends 1 & Value ? true : false

type ValidRenderInput<Input> =
  IsAny<Input> extends true
    ? never
    : [Input] extends [never]
      ? never
      : [Input] extends [void]
        ? never
        : Input

/** The markup an owned render helper may produce. */
export type RenderOutput = Html | ReadonlyArray<Html>

/**
 * Defines plain render helpers against one Composition's Model, Message, and
 * View requirements.
 *
 * The callable form supplies the Model and builder. `builder` defines markup
 * that needs only the builder. `withInput` defines markup from a domain input
 * without adding an unused Model parameter. Render helpers remain plain
 * functions and cannot complete a Block or Application as its branded view.
 */
export interface DefineRender<Model, Message, ViewRequirements> {
  <Output extends RenderOutput>(
    render: (model: Model, h: HtmlBuilder<Message, ViewRequirements>) => Output,
  ): (model: Model, h: HtmlBuilder<Message, ViewRequirements>) => Output

  readonly builder: <Output extends RenderOutput>(
    render: (h: HtmlBuilder<Message, ViewRequirements>) => Output,
  ) => (h: HtmlBuilder<Message, ViewRequirements>) => Output

  readonly withInput: <Input = never>() => <Output extends RenderOutput>(
    render: [ValidRenderInput<Input>] extends [never]
      ? never
      : (
          input: NoInfer<ValidRenderInput<Input>>,
          h: HtmlBuilder<Message, ViewRequirements>,
        ) => Output,
  ) => (
    input: ValidRenderInput<Input>,
    h: HtmlBuilder<Message, ViewRequirements>,
  ) => Output
}

/** @internal Creates the render helper carried by a Composition. */
export const makeDefineRender = <
  Model,
  Message,
  ViewRequirements,
>(): DefineRender<Model, Message, ViewRequirements> => {
  const defineRender = <Output extends RenderOutput>(
    render: (model: Model, h: HtmlBuilder<Message, ViewRequirements>) => Output,
  ) => render

  const builder = <Output extends RenderOutput>(
    render: (h: HtmlBuilder<Message, ViewRequirements>) => Output,
  ) => render

  const withInput =
    <Input = never>() =>
    <Output extends RenderOutput>(
      render: [ValidRenderInput<Input>] extends [never]
        ? never
        : (
            input: NoInfer<ValidRenderInput<Input>>,
            h: HtmlBuilder<Message, ViewRequirements>,
          ) => Output,
    ) =>
      render

  return globalThis.Object.assign(defineRender, { builder, withInput })
}
