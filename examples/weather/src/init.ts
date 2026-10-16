import { ApplicationComposition } from './composition'
import { Model, WeatherAsyncData } from './model'

export const init = ApplicationComposition.init(() => ({
  model: Model.make({
    zipCodeInput: '',
    weather: WeatherAsyncData.Idle(),
  }),
}))
