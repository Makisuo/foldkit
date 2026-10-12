import { Layer } from 'effect'

import { BrowserKeyValueStore } from '@effect/platform-browser'

import { RoomsClientLayer } from './rpc'
import { EffectsLayer } from './submodel'

const ServicesLayer = Layer.mergeAll(
  RoomsClientLayer,
  BrowserKeyValueStore.layerSessionStorage,
)

export const AppLayer = Layer.provide(EffectsLayer, ServicesLayer)
