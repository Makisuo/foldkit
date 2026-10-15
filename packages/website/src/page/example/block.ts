import { ExampleDetailComposition } from './composition'
import {
  EffectsLayer,
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
  tableOfContents,
  update,
  view,
} from './example'
export { mounts } from './composition'

export const block = ExampleDetailComposition.toBlock({
  init,
  update,
  view,
  expose: { boot, informRouteChanged },
  EffectsLayer,
})
