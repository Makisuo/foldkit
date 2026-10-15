import { Option } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { ApiReference } from './definition'
import {
  type ApiData,
  ApiDataAsyncData,
  Model,
  disclosuresForApiData,
} from './model'
import { LoadApiData } from './update'

export const init = ApiReference.init(() => ({
  model: Model.make({
    apiData: ApiDataAsyncData.Idle(),
    disclosures: {},
  }),
}))

export const boot = ApiReference.step(
  (model, maybeApiData: Option.Option<ApiData> = Option.none()) => {
    const nextModel = Option.match(maybeApiData, {
      onNone: () =>
        modifyFields(model, { apiData: () => ApiDataAsyncData.Loading() }),
      onSome: apiData =>
        modifyFields(model, {
          apiData: () => ApiDataAsyncData.Refreshing({ data: apiData }),
          disclosures: () => disclosuresForApiData(apiData),
        }),
    })

    return { model: nextModel, commands: [LoadApiData()] }
  },
)
