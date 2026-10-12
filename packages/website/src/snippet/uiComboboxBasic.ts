import { Array, Layer, Option, Schema } from 'effect'
import { Submodel, Update } from 'foldkit'
import { childAttributes } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Combobox } from '@foldkit/ui'

const City = Schema.Literals(['Johannesburg', 'Kyiv', 'Oxford', 'Wellington'])
type City = typeof City.Type

const CityCombobox = Combobox.create(City)

const Model = Schema.Struct({
  maybeCity: Schema.Option(City),
  combobox: CityCombobox.Model,
})
type Model = typeof Model.Type

const init = () => ({
  model: Model.make({
    maybeCity: Option.none(),
    combobox: CityCombobox.init({ id: 'city' }).model,
  }),
})

const Message = defineMessageUnion({
  GotComboboxMessage: { message: CityCombobox.Message },
})
type Message = typeof Message.Type

// The parent stores the committed selection reported by the child.
const foldComboboxOutMessage = CityCombobox.OutMessage.match<
  Update.Step<Model, Message>
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { maybeCity: () => Option.some(value) }),
    }),
  ClearedSelection: () => model => ({ model }),
})

const combobox = CityCombobox.bind({
  placement: 'city',
  read: (model: Model) => Option.some(model.combobox),
  write: (model, nextCombobox) =>
    modifyFields(model, { combobox: () => nextCombobox }),
  toParentMessage: message => Message.GotComboboxMessage({ message }),
  outMessage: { fold: foldComboboxOutMessage },
})

const owner = Submodel.owner('Acme/CityPicker')

// Registering the binding collects its lifecycle and handler graph.
const contract = owner.define({ Model, Message, children: [combobox] })

const update = contract.defineUpdate((model, message) =>
  Message.match(message, {
    GotComboboxMessage: ({ message }) => combobox.fold(model, message),
  }),
)

const cities: ReadonlyArray<City> = [
  'Johannesburg',
  'Kyiv',
  'Oxford',
  'Wellington',
]

const view = contract.defineView((model, h) => {
  const filteredCities =
    model.combobox.inputValue === ''
      ? cities
      : Array.filter(cities, city =>
          city.toLowerCase().includes(model.combobox.inputValue.toLowerCase()),
        )

  const labelId = 'city-label'

  return h.div(
    [h.Class('flex flex-col gap-1.5')],
    [
      h.label([h.Id(labelId), h.For(Combobox.inputId('city'))], ['City']),
      h.submodel(
        combobox.embed({
          slotId: 'city',
          model: model.combobox,
          viewInputs: {
            ariaLabelledBy: labelId,
            items: filteredCities,
            maybeSelectedValue: model.maybeCity,
            restingInputValue: Option.getOrElse(model.maybeCity, () => ''),
            itemToValue: city => city,
            itemToDisplayText: city => city,
            itemToConfig: (city, { isSelected }) => ({
              className: 'px-3 py-2 cursor-pointer data-[active]:bg-blue-100',
              content: h.div(
                [h.Class('flex items-center gap-2')],
                [
                  isSelected ? h.span([], ['✓']) : h.span([h.Class('w-4')]),
                  h.span([], [city]),
                ],
              ),
            }),
            inputAttributes: childAttributes([
              h.Class('w-full rounded-lg border px-3 py-2'),
              h.Placeholder('Search cities...'),
            ]),
            itemsAttributes: childAttributes([
              h.Class('rounded-lg border shadow-lg'),
            ]),
            backdropAttributes: childAttributes([h.Class('fixed inset-0')]),
            anchor: { placement: 'bottom-start', gap: 8, padding: 8 },
          },
        }),
      ),
    ],
  )
})

const descriptor = contract.compose({
  init,
  update,
  view,
  EffectsLayer: Layer.empty,
})

export { Model, Message, init }
export const bind = descriptor.bind
export const EffectsLayer = descriptor.EffectsLayer
export const subscriptions = descriptor.subscriptions
export const managedResources = descriptor.managedResources
export const mounts = descriptor.mounts
