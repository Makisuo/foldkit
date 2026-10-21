import { Layer } from 'effect'

import {
  City,
  CityBlock,
  type ItemSchema,
  makeEchoParts,
  stringEchoParts,
} from './generic-handler-contracts.accepted.js'

export const checkGenericHandlerContracts = <Item extends string, ItemEncoded>(
  Item: ItemSchema<Item, ItemEncoded>,
) => {
  const { composition, init, update, Echo } = makeEchoParts(Item)

  // @ts-expect-error Invariant Args and Message contracts reject String for generic Item.
  const wrongLayer: typeof Echo.layer = stringEchoParts.Echo.layer
  void wrongLayer

  // @ts-expect-error Same-name String handlers cannot satisfy every generic Item contract.
  composition.assembleBlock({
    init,
    update,
    EffectsLayer: stringEchoParts.Echo.layer,
  })

  return composition.assembleBlock({ init, update, EffectsLayer: Echo.layer })
}

const cityParts = makeEchoParts(City)
// @ts-expect-error The concrete handler must preserve the City payload.
cityParts.composition.assembleBlock({
  init: cityParts.init,
  update: cityParts.update,
  EffectsLayer: stringEchoParts.Echo.layer,
})

// @ts-expect-error Generic completion preserves the concrete Message payload.
CityBlock.Message.CompletedEcho({ value: 'Mars' })
// @ts-expect-error Generic completion preserves the init argument type.
CityBlock.init(123)
const optionalView = cityParts.composition.makeView((_model, h) => h.div([]))
type MissingHandlerWithOptionalView = Readonly<{
  init: typeof cityParts.init
  update: typeof cityParts.update
  EffectsLayer: typeof Layer.empty
  view?: typeof optionalView
}>
// @ts-expect-error An optional view must not bypass local handler completeness.
cityParts.composition.assembleBlock<MissingHandlerWithOptionalView>({
  init: cityParts.init,
  update: cityParts.update,
  EffectsLayer: Layer.empty,
})

type MissingHandlerWithOptionalEffects = Readonly<{
  init: typeof cityParts.init
  update: typeof cityParts.update
  EffectsLayer?: typeof Layer.empty
}>
// @ts-expect-error An optional Layer must not bypass local handler completeness.
cityParts.composition.assembleBlock<MissingHandlerWithOptionalEffects>({
  init: cityParts.init,
  update: cityParts.update,
})
