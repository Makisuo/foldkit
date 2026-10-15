import { Schema } from 'effect'
import { AsyncData, defineApplication } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

export const WeatherData = Schema.Struct({
  zipCode: Schema.String,
  temperature: Schema.Number,
  description: Schema.String,
  humidity: Schema.Number,
  windSpeed: Schema.Number,
  locationName: Schema.String,
  region: Schema.String,
})
export type WeatherData = typeof WeatherData.Type

export const WeatherAsyncData = AsyncData.Schema(WeatherData, Schema.String)

export const Model = Schema.Struct({
  zipCodeInput: Schema.String,
  weather: WeatherAsyncData.schema,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  UpdatedZipCodeInput: { value: Schema.String },
  SubmittedWeatherForm: {},
  SucceededFetchWeather: { weather: WeatherData },
  FailedFetchWeather: { error: Schema.String },
})

export type Message = typeof Message.Type

export const Application = defineApplication({ Model, Message })
