import { Layer } from 'effect'

import { ChartRegistryLayer } from './chartRegistry'
import { FetchTelemetry, SyncChart } from './command'
import { GitHubApiLayer } from './githubApi'
import { NpmApiLayer } from './npmApi'
import { MountChart } from './view'

const TelemetryApisLayer = Layer.mergeAll(GitHubApiLayer, NpmApiLayer)

export const EffectsLayer = Layer.mergeAll(
  FetchTelemetry.layer.pipe(Layer.provide(TelemetryApisLayer)),
  SyncChart.layer,
  MountChart.layer,
).pipe(Layer.provide(ChartRegistryLayer))
