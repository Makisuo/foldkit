import { Layer } from 'effect'

import * as Search from './search'
import { LocalStorageLayer, SessionStorageLayer } from './storage'
import { EffectsLayer } from './submodel'

const ServicesLayer = Layer.mergeAll(
  LocalStorageLayer,
  SessionStorageLayer,
  Search.PagefindLayer,
)

export const AppLayer = Layer.provide(EffectsLayer, ServicesLayer)
