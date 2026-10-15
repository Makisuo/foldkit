import { Model } from './definition'
import { ProfileComposition, update } from './profile'
import { view } from './view'

export const block = ProfileComposition.toBlock({
  init: () => ({ model: Model.make({ child: undefined }) }),
  update,
  view,
})
