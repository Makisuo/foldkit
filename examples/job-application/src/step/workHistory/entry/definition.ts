import { Option, Schema } from 'effect'
import { Block, Update } from 'foldkit'
import { CalendarDate } from 'foldkit/calendar'
import {
  Field,
  NotValidated,
  allValid,
  anyInvalid,
  makeRules,
  validate,
} from 'foldkit/fieldValidation'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { DatePicker } from '@foldkit/ui'
import { reflectMaxDate, reflectMinDate } from '@foldkit/ui/datePicker'

import { revealFieldErrors } from '../../validation'

// FIELD VALIDATION

export const companyRules = makeRules({
  required: 'Company is required',
})

export const titleRules = makeRules({
  required: 'Job title is required',
})

const validateCompany = validate(companyRules)
const validateTitle = validate(titleRules)

export const Model = Schema.Struct({
  id: Schema.String,
  company: Field(Schema.String),
  title: Field(Schema.String),
  startDate: DatePicker.Model,
  maybeStartDate: Schema.Option(CalendarDate),
  endDate: DatePicker.Model,
  maybeEndDate: Schema.Option(CalendarDate),
  isCurrentlyEmployed: Schema.Boolean,
  description: Schema.String,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  UpdatedCompany: { value: Schema.String },
  UpdatedTitle: { value: Schema.String },
  GotStartDateMessage: { message: DatePicker.Message },
  GotEndDateMessage: { message: DatePicker.Message },
  ToggledCurrentlyEmployed: { isChecked: Schema.Boolean },
  UpdatedDescription: { value: Schema.String },
  ClickedRemoveSelf: {},
})

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  Removed: {},
})

export type OutMessage = typeof OutMessage.Type

export type Removed = typeof OutMessage.Removed.Type

export const init = (entryId: string, today: CalendarDate): Model => ({
  id: entryId,
  company: NotValidated({ value: '' }),
  title: NotValidated({ value: '' }),
  startDate: DatePicker.init({ id: `${entryId}-start`, today }),
  maybeStartDate: Option.none(),
  endDate: DatePicker.init({ id: `${entryId}-end`, today }),
  maybeEndDate: Option.none(),
  isCurrentlyEmployed: false,
  description: '',
})

const foldStartDateOutMessage = DatePicker.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedViewMonth: () => model => ({ model }),
  SelectedDate:
    ({ date }) =>
    model => ({
      model: modifyFields(model, {
        maybeStartDate: () => Option.some(date),
        endDate: reflectMinDate(Option.some(date)),
      }),
    }),
  ClearedDate: () => model => ({
    model: modifyFields(model, {
      maybeStartDate: () => Option.none(),
      endDate: reflectMinDate(Option.none()),
    }),
  }),
})

export const startDatePicker = DatePicker.block.connection({
  Model: Model,
  field: 'startDate',
  parentMessage: Message.GotStartDateMessage,
  outMessage: { fold: foldStartDateOutMessage },
})

const foldEndDateOutMessage = DatePicker.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedViewMonth: () => model => ({ model }),
  SelectedDate:
    ({ date }) =>
    model => ({
      model: modifyFields(model, {
        maybeEndDate: () => Option.some(date),
        startDate: reflectMaxDate(Option.some(date)),
      }),
    }),
  ClearedDate: () => model => ({
    model: modifyFields(model, {
      maybeEndDate: () => Option.none(),
      startDate: reflectMaxDate(Option.none()),
    }),
  }),
})

export const endDatePicker = DatePicker.block.connection({
  Model: Model,
  field: 'endDate',
  parentMessage: Message.GotEndDateMessage,
  outMessage: { fold: foldEndDateOutMessage },
})

const WorkHistoryEntryDefinition = Block.define('WorkHistoryEntry', {
  Model,
  Message,
  OutMessage,
})

export const RegisteredWorkHistoryEntryDefinition =
  WorkHistoryEntryDefinition.register({
    children: [startDatePicker, endDatePicker],
  })

export const update = WorkHistoryEntryDefinition.update((model, message) =>
  Message.match(message, {
    UpdatedCompany: ({ value }) => ({
      model: modifyFields(model, { company: () => validateCompany(value) }),
    }),

    UpdatedTitle: ({ value }) => ({
      model: modifyFields(model, { title: () => validateTitle(value) }),
    }),

    GotStartDateMessage: ({ message }) => startDatePicker.fold(model, message),

    GotEndDateMessage: ({ message }) => endDatePicker.fold(model, message),

    ToggledCurrentlyEmployed: ({ isChecked }) => ({
      model: modifyFields(model, { isCurrentlyEmployed: () => isChecked }),
    }),

    UpdatedDescription: ({ value }) => ({
      model: modifyFields(model, { description: () => value }),
    }),

    ClickedRemoveSelf: () => ({ model, outMessage: OutMessage.Removed() }),
  }),
)

// VALIDATION SUMMARY

export const hasErrors = (entry: Model): boolean =>
  anyInvalid([entry.company, entry.title])

export const isComplete = (entry: Model): boolean =>
  allValid([
    [entry.company, companyRules],
    [entry.title, titleRules],
  ])

export const revealErrors = (entry: Model): Model =>
  modifyFields(entry, {
    company: revealFieldErrors(companyRules),
    title: revealFieldErrors(titleRules),
  })
