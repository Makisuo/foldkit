import { AsyncData, type Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { FetchWeather } from './command'
import { Application, Message, Model, WeatherAsyncData } from './definition'

export const ApplicationComposition = Application.toComposition()
export type ApplicationViewBuilder = Block.HtmlBuilderOf<
  typeof ApplicationComposition
>

export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    UpdatedZipCodeInput: ({ value }) => ({
      model: modifyFields(model, {
        zipCodeInput: () => value,
      }),
    }),

    SubmittedWeatherForm: () => {
      if (AsyncData.isPending(model.weather)) {
        return { model }
      }
      return {
        model: modifyFields(model, {
          weather: () => WeatherAsyncData.Loading(),
        }),
        commands: [FetchWeather({ zipCode: model.zipCodeInput })],
      }
    },

    SucceededFetchWeather: ({ weather }) => ({
      model: modifyFields(model, {
        weather: () => WeatherAsyncData.Success({ data: weather }),
      }),
    }),

    FailedFetchWeather: ({ error }) => ({
      model: modifyFields(model, {
        weather: () => WeatherAsyncData.Failure({ error }),
      }),
    }),
  }),
)

export const init = () => ({
  model: Model.make({
    zipCodeInput: '',
    weather: WeatherAsyncData.Idle(),
  }),
})
