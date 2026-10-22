import type { Block } from 'foldkit'

import {
  ApplicationComposition,
  FetchCountLayer,
  type Model,
  update,
} from './counterHttpCommand'

export const init = ApplicationComposition.makeInit(
  (): Readonly<{ model: typeof Model.Type }> => ({
    model: { count: 0 },
  }),
)

export const view = ApplicationComposition.makeView((model, h) => ({
  title: `Count: ${model.count}`,
  body: h.p([], [model.count.toString()]),
}))

const assemble = () =>
  ApplicationComposition.assembleBlock({
    init,
    update,
    view,
    EffectsLayer: FetchCountLayer,
  })
export const ApplicationBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemble
> = assemble()
