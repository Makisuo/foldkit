import { Option } from 'effect'

import { AttachmentsComposition } from './composition'
import { update } from './update'
import { view } from './view'

export const block = AttachmentsComposition.toBlock({
  init: AttachmentsComposition.init(() => ({
    model: {
      maybeResume: Option.none(),
      additionalFiles: [],
    },
  })),
  update,
  view,
})
