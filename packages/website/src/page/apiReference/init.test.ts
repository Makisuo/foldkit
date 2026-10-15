import { Option } from 'effect'
import { Command, Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'
import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  ApiFunction,
  ApiModule,
  SIGNATURE_COLLAPSE_THRESHOLD,
  scopedId,
} from './domain'
import { boot, init } from './init'
import { Message } from './message'
import { ApiData, ApiDataAsyncData, type Model } from './model'
import { LoadApiData, informRouteChanged, update } from './update'

const apiModule = ApiModule.make({
  name: 'Command',
  functions: [
    ApiFunction.make({
      name: 'define',
      description: Option.none(),
      signatures: [
        {
          parameters: [],
          returnType: 'A'.repeat(SIGNATURE_COLLAPSE_THRESHOLD + 1),
          typeParameters: [],
        },
      ],
      sourceUrl: Option.none(),
    }),
  ],
  types: [],
  interfaces: [],
  variables: [],
})
const seededData = ApiData.make({
  parsedApi: { modules: [apiModule] },
  highlights: {},
})
const fullData = ApiData.make({
  parsedApi: {
    modules: [apiModule, { ...apiModule, name: 'Update' }],
  },
  highlights: {},
})
const signatureId = scopedId('function', 'Command', 'define')

const failedLoad = (model: Model) =>
  update(model, Message.FailedLoadApiData({ error: 'Offline' }))

describe('API Reference startup', () => {
  test('init creates an idle baseline without Commands', () => {
    expect(init()).toEqual({
      model: { apiData: ApiDataAsyncData.Idle(), disclosures: {} },
    })
  })

  test('cold boot schedules the full reference load', () => {
    const apiReferenceBoot = boot(init().model)

    expect(apiReferenceBoot.model.apiData).toEqual(ApiDataAsyncData.Loading())
    expect(apiReferenceBoot.commands).toHaveLength(1)
    expect(apiReferenceBoot.commands?.map(command => command.name)).toEqual([
      LoadApiData.name,
    ])
    expectTypeOf<Update.RequirementsOf<typeof boot>>().toEqualTypeOf<
      Command.HandlerOf<typeof LoadApiData>
    >()
  })

  test('prerendered data stays visible while the full reference loads', () => {
    const apiReferenceBoot = boot(init().model, Option.some(seededData))

    expect(apiReferenceBoot.model.apiData).toEqual(
      ApiDataAsyncData.Refreshing({ data: seededData }),
    )
    expect(apiReferenceBoot.model.disclosures).toEqual({ [signatureId]: false })
    expect(apiReferenceBoot.commands?.map(command => command.name)).toEqual([
      LoadApiData.name,
    ])
    expect(informRouteChanged(apiReferenceBoot.model)).toEqual({
      model: apiReferenceBoot.model,
    })
  })

  test('failed cold loads can be requested again', () => {
    const apiReferenceBoot = boot(init().model)
    const apiReferenceFailure = failedLoad(apiReferenceBoot.model)
    const retry = informRouteChanged(apiReferenceFailure.model)

    expect(apiReferenceFailure.model.apiData).toEqual(
      ApiDataAsyncData.Failure({ error: 'Offline' }),
    )
    expect(retry.model.apiData).toEqual(ApiDataAsyncData.Loading())
    expect(retry.commands?.map(command => command.name)).toEqual([
      LoadApiData.name,
    ])
  })

  test('failed full loads retain the seeded slice and retry on entry', () => {
    const apiReferenceBoot = boot(init().model, Option.some(seededData))
    const apiReferenceFailure = failedLoad(apiReferenceBoot.model)
    const retry = informRouteChanged(apiReferenceFailure.model)

    expect(apiReferenceFailure.model.apiData).toEqual(
      ApiDataAsyncData.Stale({ data: seededData, error: 'Offline' }),
    )
    expect(apiReferenceFailure.model.disclosures).toEqual({
      [signatureId]: false,
    })
    expect(retry.model.apiData).toEqual(
      ApiDataAsyncData.Refreshing({ data: seededData }),
    )
    expect(retry.commands?.map(command => command.name)).toEqual([
      LoadApiData.name,
    ])
    expect(informRouteChanged(retry.model)).toEqual({ model: retry.model })
  })

  test('full success adds disclosures without resetting the seeded selection', () => {
    const apiReferenceBoot = boot(init().model, Option.some(seededData))
    const expandedModel = modifyFields(apiReferenceBoot.model, {
      disclosures: () => ({ [signatureId]: true }),
    })
    const succeededLoad = update(
      expandedModel,
      Message.SucceededLoadApiData({ apiData: fullData }),
    )

    expect(succeededLoad.model.apiData).toEqual(
      ApiDataAsyncData.Success({ data: fullData }),
    )
    expect(succeededLoad.model.disclosures).toEqual({
      [signatureId]: true,
      [scopedId('function', 'Update', 'define')]: false,
    })
    expect(informRouteChanged(succeededLoad.model)).toEqual({
      model: succeededLoad.model,
    })
  })
})
