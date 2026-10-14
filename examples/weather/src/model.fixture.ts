import type { Model, WeatherData } from './application'
import { WeatherAsyncData } from './application'

export const weatherModel: Model = {
  zipCodeInput: '90210',
  weather: WeatherAsyncData.Idle(),
}

export const weatherData: WeatherData = {
  zipCode: '90210',
  temperature: 72,
  description: 'Clear sky',
  humidity: 45,
  windSpeed: 10,
  locationName: 'Beverly Hills',
  region: 'California',
}
