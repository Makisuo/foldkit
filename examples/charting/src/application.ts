import { Layer } from 'effect'

import { ChartRegistryLayer } from './chartRegistry'
import { FetchTelemetry, SyncChart } from './command'
import { GitHubApiLayer } from './githubApi'
import { init } from './init'
import { NpmApiLayer } from './npmApi'
import { Application, update } from './update'
import { MountChart, view } from './view'

const TelemetryApisLayer = Layer.mergeAll(GitHubApiLayer, NpmApiLayer)

const EffectsLayer = Layer.mergeAll(
  FetchTelemetry.layer.pipe(Layer.provide(TelemetryApisLayer)),
  SyncChart.layer,
  MountChart.layer,
).pipe(Layer.provide(ChartRegistryLayer))

export const implementation = {
  init,
  update,
  view,
  EffectsLayer,
}

export { Application }
