import { Context, Effect, Layer, Option } from 'effect'
import type { Map as MapInstance } from 'maplibre-gl'

type MapRegistryShape = Readonly<{
  get: (hostId: string) => Effect.Effect<Option.Option<MapInstance>>
  set: (hostId: string, instance: MapInstance) => Effect.Effect<void>
  remove: (hostId: string, instance: MapInstance) => Effect.Effect<void>
}>

export class MapRegistry extends Context.Service<
  MapRegistry,
  MapRegistryShape
>()('map/MapRegistry') {}

export const MapRegistryLayer = Layer.effect(
  MapRegistry,
  Effect.sync(() => {
    const instancesByHostId = new Map<string, MapInstance>()

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
