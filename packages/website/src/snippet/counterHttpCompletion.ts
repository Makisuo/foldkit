import { ApplicationDefinition, type Model } from './counterHttpCommand'

export const init = (): Readonly<{ model: Model }> => ({ model: { count: 0 } })

export const view = ApplicationDefinition.view((model, h) => ({
  title: `Count: ${model.count}`,
  body: h.p([], [model.count.toString()]),
}))
