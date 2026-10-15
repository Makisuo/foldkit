import { Array } from 'effect'
import { defineApplication } from 'foldkit'

import { Applicant } from './applicant'
import { Message } from './message'
import { Model } from './model'

const Application = defineApplication({ Model, Message })

export const applicants = Application.bindChild(Applicant.block, {
  field: 'applicants',
  key: 'id',
  childField: 'entry',
  toParentMessage: (applicantId, message) =>
    Message.GotApplicantMessage({ applicantId, message }),
})

const ApplicationComposition = Application.toComposition({
  children: [applicants],
})

export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    GotApplicantMessage: ({ applicantId, message }) =>
      applicants.fold(model, applicantId, message),
  }),
)

export const view = ApplicationComposition.view((model, h) =>
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
