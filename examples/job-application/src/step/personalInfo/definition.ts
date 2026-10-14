import { Array, Duration, Effect, Match, Number, Option, Schema } from 'effect'
import { Block, Update } from 'foldkit'
import { CalendarDate } from 'foldkit/calendar'
import {
  Field,
  Invalid,
  NotValidated,
  Rule,
  Valid,
  Validating,
  allValid,
  anyInvalid,
  makeRules,
  validate,
} from 'foldkit/fieldValidation'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { DatePicker, Listbox } from '@foldkit/ui'

import { revealFieldErrors } from '../validation'

export const PronounsListbox = Listbox.create()

export const Model = Schema.Struct({
  firstName: Field(Schema.String),
  lastName: Field(Schema.String),
  email: Field(Schema.String),
  emailValidationId: Schema.Number,
  phone: Field(Schema.String),
  pronouns: PronounsListbox.Model,
  maybeSelectedPronoun: Schema.Option(Schema.String),
  customPronouns: Schema.String,
  portfolioUrl: Field(Schema.String),
  availableDate: DatePicker.Model,
  maybeAvailableDate: Schema.Option(CalendarDate),
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  UpdatedFirstName: { value: Schema.String },
  UpdatedLastName: { value: Schema.String },
  UpdatedEmail: { value: Schema.String },
  CompletedValidateEmailAsync: {
    validationId: Schema.Number,
    field: Field(Schema.String),
  },
  UpdatedPhone: { value: Schema.String },
  GotPronounsMessage: { message: PronounsListbox.Message },
  UpdatedCustomPronouns: { value: Schema.String },
  UpdatedPortfolioUrl: { value: Schema.String },
  GotAvailableDateMessage: { message: DatePicker.Message },
})

export type Message = typeof Message.Type

const PersonalInfoDefinition = Block.define('PersonalInfo', {
  Model,
  Message,
})

export const init = (today: CalendarDate): Model => ({
  firstName: NotValidated({ value: '' }),
  lastName: NotValidated({ value: '' }),
  email: NotValidated({ value: '' }),
  emailValidationId: 0,
  phone: NotValidated({ value: '' }),
  pronouns: PronounsListbox.init({ id: 'pronouns' }).model,
  maybeSelectedPronoun: Option.none(),
  customPronouns: '',
  portfolioUrl: NotValidated({ value: '' }),
  availableDate: DatePicker.init({
    id: 'available-date',
    today,
    minDate: today,
  }),
  maybeAvailableDate: Option.none(),
})

// FIELD VALIDATION

const firstNameRules = makeRules({
  required: 'First name is required',
  rules: [Rule.minLength(2, 'First name must be at least 2 characters')],
})

const lastNameRules = makeRules({
  required: 'Last name is required',
})

const emailRules = makeRules({
  required: 'Email is required',
  rules: [Rule.email('Please enter a valid email address')],
})

const PHONE_PATTERN = /^\+?[\d\s()-]{7,}$/

const phoneRules = makeRules({
  rules: [Rule.pattern(PHONE_PATTERN, 'Please enter a valid phone number')],
})

const portfolioUrlRules = makeRules({
  rules: [
    Rule.url({
      message: 'Please enter a valid URL',
      requireProtocol: false,
    }),
  ],
})

const validateFirstName = validate(firstNameRules)
const validateLastName = validate(lastNameRules)
const validateEmail = validate(emailRules)
const validatePhone = validate(phoneRules)
const validatePortfolioUrl = validate(portfolioUrlRules)

const FAKE_API_DELAY_MS = 600

const TAKEN_EMAILS = [
  'admin@foldkit.dev',
  'test@example.com',
  'demo@foldkit.dev',
]

const isEmailTaken = (emailInput: string): Effect.Effect<boolean> =>
  Effect.gen(function* () {
    yield* Effect.sleep(Duration.millis(FAKE_API_DELAY_MS))
    return Array.contains(TAKEN_EMAILS, emailInput.toLowerCase())
  })

export const ValidateEmailAsync = PersonalInfoDefinition.command(
  'ValidateEmailAsync',
  {
    args: { emailInput: Schema.String, validationId: Schema.Number },
    messages: [Message.CompletedValidateEmailAsync],
    handler: function* () {
      return ({ emailInput, validationId }) =>
        Effect.gen(function* () {
          if (yield* isEmailTaken(emailInput)) {
            return Message.CompletedValidateEmailAsync({
              validationId,
              field: Invalid({
                value: emailInput,
                errors: ['This email is already in use'],
              }),
            })
          }
          return Message.CompletedValidateEmailAsync({
            validationId,
            field: Valid({ value: emailInput }),
          })
        })
    },
  },
)

export const EffectsLayer = ValidateEmailAsync.layer

const foldPronounsOutMessage = PronounsListbox.OutMessage.match<
  Update.Step<Model, Message>
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        maybeSelectedPronoun: () => Option.some(value),
      }),
    }),
})

export const pronounsListbox = PronounsListbox.connection({
  Model: Model,
  field: 'pronouns',
  parentMessage: Message.GotPronounsMessage,
  outMessage: { fold: foldPronounsOutMessage },
})

const foldAvailableDateOutMessage = DatePicker.OutMessage.match<
  Update.Step<Model, Message>
>({
  SelectedDate:
    ({ date }) =>
    model => ({
      model: modifyFields(model, {
        maybeAvailableDate: () => Option.some(date),
      }),
    }),
  ClearedDate: () => model => ({
    model: modifyFields(model, { maybeAvailableDate: () => Option.none() }),
  }),
  ChangedViewMonth: () => model => ({ model }),
})

export const availableDatePicker = DatePicker.block.connection({
  Model: Model,
  field: 'availableDate',
  parentMessage: Message.GotAvailableDateMessage,
  outMessage: { fold: foldAvailableDateOutMessage },
})

export const RegisteredPersonalInfoDefinition = PersonalInfoDefinition.register(
  {
    children: [pronounsListbox, availableDatePicker],
  },
)

export const update = PersonalInfoDefinition.update((model, message) =>
  Message.match(message, {
    UpdatedFirstName: ({ value }) => ({
      model: modifyFields(model, { firstName: () => validateFirstName(value) }),
    }),

    UpdatedLastName: ({ value }) => ({
      model: modifyFields(model, { lastName: () => validateLastName(value) }),
    }),

    UpdatedEmail: ({ value }) => {
      const validationId = Number.increment(model.emailValidationId)
      return Match.value(validateEmail(value)).pipe(
        Match.tag('Valid', () => ({
          model: modifyFields(model, {
            email: () => Validating({ value }),
            emailValidationId: () => validationId,
          }),
          commands: [ValidateEmailAsync({ emailInput: value, validationId })],
        })),
        Match.orElse(syncResult => ({
          model: modifyFields(model, {
            email: () => syncResult,
            emailValidationId: () => validationId,
          }),
        })),
      )
    },

    CompletedValidateEmailAsync: ({ validationId, field }) => {
      if (validationId === model.emailValidationId) {
        return { model: modifyFields(model, { email: () => field }) }
      } else {
        return { model }
      }
    },

    UpdatedPhone: ({ value }) => ({
      model: modifyFields(model, { phone: () => validatePhone(value) }),
    }),

    GotPronounsMessage: ({ message }) => pronounsListbox.fold(model, message),

    UpdatedCustomPronouns: ({ value }) => ({
      model: modifyFields(model, { customPronouns: () => value }),
    }),

    UpdatedPortfolioUrl: ({ value }) => ({
      model: modifyFields(model, {
        portfolioUrl: () => validatePortfolioUrl(value),
      }),
    }),

    GotAvailableDateMessage: ({ message }) =>
      availableDatePicker.fold(model, message),
  }),
)

// VALIDATION SUMMARY

const validatedFields = (model: Model): ReadonlyArray<Field<string>> => [
  model.firstName,
  model.lastName,
  model.email,
  model.phone,
  model.portfolioUrl,
]

export const hasErrors = (model: Model): boolean =>
  anyInvalid(validatedFields(model))

export const isComplete = (model: Model): boolean =>
  allValid([
    [model.firstName, firstNameRules],
    [model.lastName, lastNameRules],
    [model.email, emailRules],
    [model.phone, phoneRules],
    [model.portfolioUrl, portfolioUrlRules],
  ])

export const revealErrors = (model: Model): Model =>
  modifyFields(model, {
    firstName: revealFieldErrors(firstNameRules),
    lastName: revealFieldErrors(lastNameRules),
    email: revealFieldErrors(emailRules),
    phone: revealFieldErrors(phoneRules),
    portfolioUrl: revealFieldErrors(portfolioUrlRules),
  })
