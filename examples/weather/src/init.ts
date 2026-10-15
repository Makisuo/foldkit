import { Application } from './definition'
import { Model, WeatherAsyncData } from './model'

export const init = Application.init(() => ({
  model: Model.make({
    zipCodeInput: '',
    weather: WeatherAsyncData.Idle(),
  }),
}))
