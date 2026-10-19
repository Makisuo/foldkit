import {
  ApplicationComposition,
  FetchCountLayer,
  type Model,
  update,
} from './counterHttpCommand'

export const init = ApplicationComposition.makeInit(
  (): Readonly<{ model: Model }> => ({
    model: { count: 0 },
  }),
)

export const view = ApplicationComposition.makeView((model, h) => ({
  title: `Count: ${model.count}`,
  body: h.p([], [model.count.toString()]),
}))

export const ApplicationBlock = ApplicationComposition.assembleBlock({
  init,
  update,
  view,
  EffectsLayer: FetchCountLayer,
})
