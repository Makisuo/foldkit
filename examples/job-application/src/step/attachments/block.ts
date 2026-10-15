import { modifyFields } from 'foldkit/struct'

import {
  AttachmentsComposition,
  additionalFilesDrop,
  resumeDrop,
} from './composition'
import { Attachments } from './definition'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const block = AttachmentsComposition.toBlock({
  init: Attachments.init(() => {
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
  }),
  update,
  view,
})
