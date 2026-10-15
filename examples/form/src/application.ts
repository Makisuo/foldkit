import { Array, Duration, Effect, Layer, Random, Schema } from 'effect'
import type { Block } from 'foldkit'
import {
  Invalid,
  NotValidated,
  Valid,
  Validating,
} from 'foldkit/fieldValidation'
import { modifyFields } from 'foldkit/struct'

import { Application, Message, type Model, Submission } from './definition'
import { isFormValid, validateEmail, validateName } from './validation'

export const ApplicationComposition = Application.toComposition()
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>

export const initialModel: Model = {
  name: NotValidated({ value: '' }),
  email: NotValidated({ value: '' }),
  messageText: NotValidated({ value: '' }),
  submission: Submission.NotSubmitted(),
}

export const init = Application.init(() => ({
  model: initialModel,
}))

// FIELD VALIDATION

const FAKE_API_DELAY_MS = 500

const EMAILS_ON_WAITLIST = [
  'test@example.com',
  'demo@email.com',
  'admin@test.com',
]

const isEmailOnWaitlist = (email: string): Effect.Effect<boolean> =>
  Effect.gen(function* () {
    yield* Effect.sleep(Duration.millis(FAKE_API_DELAY_MS))
    return Array.contains(EMAILS_ON_WAITLIST, email.toLowerCase())
  })

export const ValidateEmail = Application.command('ValidateEmail', {
  args: { email: Schema.String },
  messages: [Message.CompletedValidateEmail],
  handler: function* () {
    return ({ email }) =>
      Effect.gen(function* () {
        if (yield* isEmailOnWaitlist(email)) {
          return Message.CompletedValidateEmail({
            field: Invalid({
              value: email,
              errors: ['This email is already on our waitlist'],
            }),
          })
        } else {
          return Message.CompletedValidateEmail({
            field: Valid({ value: email }),
          })
        }
      })
  },
})

export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    UpdatedName: ({ value }) => ({
      model: modifyFields(model, {
        name: () => validateName(value),
      }),
    }),

    UpdatedEmail: ({ value }) => {
      const validateEmailResult = validateEmail(value)

      if (validateEmailResult._tag === 'Valid') {
        return {
          model: modifyFields(model, {
            email: () => Validating({ value }),
          }),
          commands: [ValidateEmail({ email: value })],
        }
      } else {
        return {
          model: modifyFields(model, {
            email: () => validateEmailResult,
          }),
        }
      }
    },

    CompletedValidateEmail: ({ field }) => {
      if (field.value === model.email.value) {
        return {
          model: modifyFields(model, {
            email: () => field,
          }),
        }
      } else {
        return { model }
      }
    },

    UpdatedMessageText: ({ value }) => ({
      model: modifyFields(model, {
        messageText: () => Valid({ value }),
      }),
    }),

    ClickedFormSubmit: () => {
      if (model.submission._tag === 'Submitting') {
        return { model }
      }

      if (!isFormValid(model)) {
        return { model }
      }

      return {
        model: modifyFields(model, {
          submission: () => Submission.Submitting(),
        }),
        commands: [
          SubmitForm({
            name: model.name.value,
            email: model.email.value,
            messageText: model.messageText.value,
          }),
        ],
      }
    },

    SucceededSubmitForm: ({ name }) => ({
      model: modifyFields(model, {
        submission: () =>
          Submission.SubmitSuccess({
            confirmationText: `Welcome to the waitlist, ${name}! We'll be in touch soon.`,
          }),
      }),
    }),

    FailedSubmitForm: () => ({
      model: modifyFields(model, {
        submission: () =>
          Submission.SubmitError({
            error:
              'Sorry, there was an error adding you to the waitlist. Please try again.',
          }),
      }),
    }),
  }),
)

export const SubmitForm = Application.command('SubmitForm', {
  args: {
    name: Schema.String,
    email: Schema.String,
    messageText: Schema.String,
  },
  messages: [Message.SucceededSubmitForm, Message.FailedSubmitForm],
  handler: function* () {
    return ({ name }) =>
      Effect.gen(function* () {
        yield* Effect.sleep(`${FAKE_API_DELAY_MS} millis`)

        const isSuccess = yield* Random.nextBoolean
        if (isSuccess) {
          return Message.SucceededSubmitForm({ name })
        } else {
          return Message.FailedSubmitForm()
        }
      })
  },
})

export const EffectsLayer = Layer.mergeAll(
  ValidateEmail.layer,
  SubmitForm.layer,
)
