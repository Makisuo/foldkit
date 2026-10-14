import type { Application, Block, Html } from '../src/index.js'
import {
  ApplicationComposition,
  ChildModel,
  ParentComposition,
  ParentModel,
  applicationBuilderRender,
  applicationInputRender,
  applicationModelRender,
  parentArrayRender,
  parentBuilderRender,
  parentInputRender,
  parentModelRender,
} from './owned-render.accepted.js'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value

export type ParentModelParameters = Expect<
  Equal<
    Parameters<typeof parentModelRender>,
    [
      model: typeof ParentModel.Type,
      h: Block.HtmlBuilderOf<typeof ParentComposition>,
    ]
  >
>
export type ParentBuilderParameters = Expect<
  Equal<
    Parameters<typeof parentBuilderRender>,
    [h: Block.HtmlBuilderOf<typeof ParentComposition>]
  >
>
export type ParentInputParameters = Expect<
  Equal<
    Parameters<typeof parentInputRender>,
    [
      input: typeof ChildModel.Type,
      h: Block.HtmlBuilderOf<typeof ParentComposition>,
    ]
  >
>
export type ParentArrayOutput = Expect<
  ReturnType<typeof parentArrayRender> extends ReadonlyArray<Html.Html>
    ? true
    : false
>
export type ApplicationModelParameters = Expect<
  Equal<
    Parameters<typeof applicationModelRender>,
    [
      model: typeof ParentModel.Type,
      h: Application.HtmlBuilderOf<typeof ApplicationComposition>,
    ]
  >
>
export type ApplicationBuilderParameters = Expect<
  Equal<
    Parameters<typeof applicationBuilderRender>,
    [h: Application.HtmlBuilderOf<typeof ApplicationComposition>]
  >
>
export type ApplicationInputParameters = Expect<
  Equal<
    Parameters<typeof applicationInputRender>,
    [input: string, h: Application.HtmlBuilderOf<typeof ApplicationComposition>]
  >
>
