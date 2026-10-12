import { Array, Layer, Option, Schema } from 'effect'
import { Submodel } from 'foldkit'
import type { HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

type ViewInputs<Value extends string> = Readonly<{
  values: ReadonlyArray<Value>
}>

const makeMessage = <Value extends string>(Value: Schema.Schema<Value>) =>
  defineMessageUnion({ SelectedValue: { value: Value } })

const makeOutMessage = <Value extends string>(Value: Schema.Schema<Value>) =>
  defineMessageUnion({ Selected: { value: Value } })

const owner = Submodel.owner('Acme/Picker')
const EffectsLayer = Layer.empty

export const make = <Value extends string>(Value: Schema.Schema<Value>) => {
  const Model = Schema.Struct({ selected: Schema.Option(Value) })
  type Model = typeof Model.Type

  const Message = makeMessage(Value)
  const OutMessage = makeOutMessage(Value)
  const contract = owner.define({ Model, Message, OutMessage })

  const update = contract.defineUpdate((model, message) =>
    Message.match(message, {
      SelectedValue: ({ value }) => ({
        model: modifyFields(model, {
          selected: () => Option.some(value),
        }),
        outMessage: OutMessage.Selected({ value }),
      }),
    }),
  )

  const select = contract.defineStep((model, value: Value) =>
    update(model, Message.SelectedValue({ value })),
  )

  const view = contract.defineView.withInputs<ViewInputs<Value>>(
    (model, { values }, h) => {
      const buttons = Array.map(values, value =>
        h.keyed('button')(
          value,
          [h.OnClick(Message.SelectedValue({ value }))],
          [value],
        ),
      )

      return h.div(
        [],
        Array.prepend(
          buttons,
          h.p([], [Option.getOrElse(model.selected, () => 'Choose a fruit')]),
        ),
      )
    },
  )

  return contract.compose({
    init: () => ({ model: Model.make({ selected: Option.none() }) }),
    update,
    view,
    steps: { select },
    EffectsLayer,
  })
}

export type Bundle<Value extends string> = ReturnType<typeof make<Value>>

const Fruit = Schema.Literals(['Apple', 'Pear'])
const fruitPicker = make(Fruit)

const ParentModel = Schema.Struct({
  picker: fruitPicker.Model,
  selectionHistory: Schema.Array(Fruit),
})
type ParentModel = typeof ParentModel.Type

const ParentMessage = defineMessageUnion({
  GotPickerMessage: { message: fruitPicker.Message },
})

const picker = fruitPicker.bind({
  placement: 'fruit-picker',
  read: (model: ParentModel) => Option.some(model.picker),
  write: (model, nextPicker) =>
    modifyFields(model, { picker: () => nextPicker }),
  toParentMessage: message => ParentMessage.GotPickerMessage({ message }),
  outMessage: {
    fold: fruitPicker.OutMessage.match({
      Selected:
        ({ value }) =>
        (model: ParentModel) => ({
          model: modifyFields(model, {
            selectionHistory: Array.append(value),
          }),
        }),
    }),
  },
})

export const selectApple = picker.steps.select('Apple')

export const pickerView = (
  model: ParentModel,
  h: HtmlBuilder<typeof ParentMessage.Type>,
) =>
  h.submodel(
    picker.embed({
      slotId: 'fruit-picker',
      model: model.picker,
      viewInputs: { values: ['Apple', 'Pear'] },
    }),
  )
