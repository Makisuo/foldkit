import {
  EffectsLayer,
  ExampleDetailComposition,
  boot,
  informRouteChanged,
  init,
  update,
  view,
} from './example'

export {
  CurrentSourcesAsyncData,
  EffectsLayer,
  LoadExampleSources,
  Message,
  Model,
  boot,
  informRouteChanged,
  init,
  mounts,
  tableOfContents,
  update,
  view,
} from './example'

export const block = ExampleDetailComposition.toBlock({
  init,
  update,
  view,
  expose: { boot, informRouteChanged },
  EffectsLayer,
})
