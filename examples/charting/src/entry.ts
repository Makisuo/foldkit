import { Layer } from 'effect'
import { Http, Runtime } from 'foldkit'

import { EffectsLayer } from './application'
import { ApplicationComposition } from './application'
import { ChartRegistryLayer } from './chartRegistry'
import { GitHubApiLayer } from './githubApi'
import { init } from './init'
import { Message } from './message'
import { NpmApiLayer } from './npmApi'
import { update } from './update'
import { view } from './view'

const TelemetryApisLayer = Layer.mergeAll(GitHubApiLayer, NpmApiLayer).pipe(
  Layer.provide(Http.layer),
)

const ApplicationLayer = Layer.mergeAll(ChartRegistryLayer, TelemetryApisLayer)

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  EffectsLayer,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.run(application.provide(ApplicationLayer))
