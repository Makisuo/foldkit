import { Array, Schema } from 'effect'
import { Block, Update } from 'foldkit'
import { childAttributes } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Combobox } from '@foldkit/ui'
import { inputId as MultiComboboxInputId } from '@foldkit/ui/combobox'

const City = Schema.Literals(['Johannesburg', 'Kyiv', 'Oxford', 'Wellington'])
type City = typeof City.Type

const CitiesCombobox = Combobox.Multi.create(City)

const Model = Schema.Struct({
  selectedCities: Schema.Array(City),
  comboboxMulti: CitiesCombobox.Model,
})
type Model = typeof Model.Type

const init = () => ({
  model: Model.make({
    selectedCities: [],
    comboboxMulti: combobox.init({ id: 'cities-multi' }).model,
  }),
})

const Message = defineMessageUnion({
  GotComboboxMultiMessage: { message: CitiesCombobox.Message },
})
type Message = typeof Message.Type

// The parent toggles the committed value in the selection it owns.
const foldComboboxMultiOutMessage = CitiesCombobox.OutMessage.match<
  Update.Step<Model, Message>
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        selectedCities: selectedCities =>
          Array.contains(selectedCities, value)
            ? Array.filter(selectedCities, city => city !== value)
            : Array.append(selectedCities, value),
      }),
    }),
  ClearedSelection: () => model => ({ model }),
})

const combobox = CitiesCombobox.connection({
  Model,
  field: 'comboboxMulti',
  parentMessage: Message.GotComboboxMultiMessage,
  outMessage: { fold: foldComboboxMultiOutMessage },
})

// Registering the connection collects its lifecycle and handler graph.
const CitiesPickerDefinition = Block.define('CitiesPicker', { Model, Message })
const RegisteredCitiesPickerDefinition = CitiesPickerDefinition.register({
  children: [combobox],
})

const update = CitiesPickerDefinition.update((model, message) =>
  Message.match(message, {
    GotComboboxMultiMessage: ({ message }) => combobox.fold(model, message),
  }),
)

const cities: ReadonlyArray<City> = [
  'Johannesburg',
  'Kyiv',
  'Oxford',
  'Wellington',
]

const view = RegisteredCitiesPickerDefinition.view((model, h) => {
  const filteredCities =
    model.comboboxMulti.inputValue === ''
      ? cities
      : Array.filter(cities, city =>
          city
            .toLowerCase()
            .includes(model.comboboxMulti.inputValue.toLowerCase()),
        )

  const labelId = 'cities-multi-label'

  return h.div(
    [h.Class('flex flex-col gap-1.5')],
    [
      h.label(
        [h.Id(labelId), h.For(MultiComboboxInputId('cities-multi'))],
        ['Cities'],
      ),
      h.block(
        combobox.embedView({
          slotId: 'cities-multi',
          model: model.comboboxMulti,
          viewInputs: {
            ariaLabelledBy: labelId,
            items: filteredCities,
            selectedValues: model.selectedCities,
            restingInputValue: '',
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

export const block = RegisteredCitiesPickerDefinition.toBlock({
  init,
  update,
  view,
})

export { Model, Message, init }
