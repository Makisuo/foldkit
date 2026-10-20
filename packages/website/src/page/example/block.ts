import { ExampleDetailComposition } from './composition'
import { EffectsLayer, init, update, view } from './example'
import { Message } from './message'

export { mounts } from './composition'
export {
  CurrentSourcesAsyncData,
  EffectsLayer,
  init,
  LoadExampleSources,
  Message,
  Model,
  tableOfContents,
  update,
  view,
} from './example'

export const ExampleDetailBlock = ExampleDetailComposition.assembleBlock({
  init,
  update,
  view,
  operations: {
    informRouteChanged: Message.InformedOfRouteChange,
  },
  EffectsLayer,
})
