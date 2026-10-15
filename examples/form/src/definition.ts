import { Schema } from 'effect'
import { defineApplication } from 'foldkit'
import { Field } from 'foldkit/fieldValidation'
import { defineMessageUnion } from 'foldkit/message'
import { defineTaggedUnion } from 'foldkit/schema'

export const Submission = defineTaggedUnion({
  NotSubmitted: {},
  Submitting: {},
  SubmitSuccess: { confirmationText: Schema.String },
  SubmitError: { error: Schema.String },
})

export type Submission = typeof Submission.Type

export const Model = Schema.Struct({
  name: Field(Schema.String),
  email: Field(Schema.String),
  messageText: Field(Schema.String),
  submission: Submission,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  UpdatedName: { value: Schema.String },
  UpdatedEmail: { value: Schema.String },
  CompletedValidateEmail: { field: Field(Schema.String) },
  UpdatedMessageText: { value: Schema.String },
  ClickedFormSubmit: {},
  SucceededSubmitForm: { name: Schema.String },
  FailedSubmitForm: {},
})

export type Message = typeof Message.Type

export const Application = defineApplication({ Model, Message })
