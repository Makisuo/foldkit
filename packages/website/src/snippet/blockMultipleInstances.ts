import { Array } from 'effect'
import { define as defineApplication } from 'foldkit/application'
import { modifyFields } from 'foldkit/struct'

import { Applicant } from './applicant'
import { Message } from './message'
import type { Model } from './model'

export const applicants = Applicant.block.keyedConnection({
  readAll: (model: Model) => model.applicants,
  key: applicant => applicant.id,
  read: applicant => applicant.entry,
  writeAt: (model, applicantId, nextEntry) =>
    modifyFields(model, {
      applicants: Array.map(applicant =>
        applicant.id === applicantId
          ? modifyFields(applicant, { entry: () => nextEntry })
          : applicant,
      ),
    }),
  toParentMessage: (applicantId, message) =>
    Message.GotApplicantMessage({ applicantId, message }),
})

const ApplicationDefinition = defineApplication({ Model, Message })
const Application = ApplicationDefinition.register({ children: [applicants] })

export const update = Application.update((model, message) =>
  Message.match(message, {
    GotApplicantMessage: ({ applicantId, message }) =>
      applicants.fold(model, applicantId, message),
  }),
)

export const view = Application.view((model, h) =>
  h.ul(
    [h.Class('flex flex-col gap-4')],
    Array.map(model.applicants, applicant =>
      h.keyed('li')(
        applicant.id,
        [],
        [
          h.block(
            applicants.embedView({
              key: applicant.id,
              slotId: applicant.id,
              model: applicant.entry,
            }),
          ),
        ],
      ),
    ),
  ),
)
