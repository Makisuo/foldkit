import { modifyFields } from 'foldkit/struct'

import {
  additionalFilesDrop,
  attachments,
  init,
  resumeDrop,
  update,
} from './block'
import { view } from './view'

export const block = attachments.assemble({
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
