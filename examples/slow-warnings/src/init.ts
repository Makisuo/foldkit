import { Application } from './definition'
import { Model } from './model'

export const init = Application.init(() => ({
  model: Model.make({
    activeWorkload: 'Idle',
    nextWarningId: 1,
    warnings: [],
    patchRows: 0,
    patchRun: 0,
  }),
}))
