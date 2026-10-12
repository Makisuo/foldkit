import type { EChartsType } from 'echarts/core'
import { Context, Effect, Layer, Option } from 'effect'

type ChartRegistryShape = Readonly<{
  get: (hostId: string) => Effect.Effect<Option.Option<EChartsType>>
  set: (hostId: string, instance: EChartsType) => Effect.Effect<void>
  remove: (hostId: string, instance: EChartsType) => Effect.Effect<void>
}>

export class ChartRegistry extends Context.Service<
  ChartRegistry,
  ChartRegistryShape
>()('charting/ChartRegistry') {}

export const ChartRegistryLayer = Layer.effect(
  ChartRegistry,
  Effect.sync(() => {
    const instancesByHostId = new Map<string, EChartsType>()

    return {
      get: hostId =>
        Effect.sync(() => Option.fromNullishOr(instancesByHostId.get(hostId))),
      set: (hostId, instance) =>
        Effect.sync(() => {
          instancesByHostId.set(hostId, instance)
        }),
      remove: (hostId, instance) =>
        Effect.sync(() => {
          if (instancesByHostId.get(hostId) === instance) {
            instancesByHostId.delete(hostId)
          }
        }),
    }
  }),
)
