import { modifyFields } from 'foldkit/struct'

import {
  AttachmentsComposition,
  additionalFilesDrop,
  init,
  resumeDrop,
  update,
} from './attachments'
import { view } from './view'

export const block = AttachmentsComposition.toBlock({
  init: () => {
    const resumeDropInit = resumeDrop.init({ id: 'attachments-resume' })
    const additionalFilesDropInit = additionalFilesDrop.init({
      id: 'attachments-additional',
    })

    return {
      model: modifyFields(init(), {
        resumeDrop: () => resumeDropInit.model,
        additionalFilesDrop: () => additionalFilesDropInit.model,
      }),
      commands: [
        ...(resumeDropInit.commands ?? []),
        ...(additionalFilesDropInit.commands ?? []),
      ],
    }
  },
  update,
  view,
})
