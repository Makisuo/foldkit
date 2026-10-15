import { Option, Schema } from 'effect'
// Pseudocode walkthrough of the Foldkit integration points. Each labeled
// block below is an excerpt. Fit them into your own Model, init, Message,
// update, and view definitions.
import { Block, Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

import { Combobox, Dialog } from '@foldkit/ui'
import type { RenderInfo as DialogRenderInfo } from '@foldkit/ui/dialog'

const City = Schema.Literals(['Johannesburg', 'Kyiv', 'Oxford', 'Wellington'])
type City = typeof City.Type
const CityCombobox = Combobox.create(City)
const cities: ReadonlyArray<City> = [
  'Johannesburg',
  'Kyiv',
  'Oxford',
  'Wellington',
]

// One Model field for the dialog, one for the overlay it contains, plus
// the parent-owned selection (`City` and `CityCombobox` are the
// `Schema.Literals` Schema and typed factory from the Combobox example):
const Model = Schema.Struct({
  dialog: Dialog.Model,
  combobox: CityCombobox.Model,
  maybeCity: Schema.Option(City),
  // ...your other fields
})
type Model = typeof Model.Type

// Embed each block's Message in your parent Message and delegate both to
// their own update (see the Dialog and Combobox examples for the delegation).
const Message = defineMessageUnion({
  GotDialogMessage: { message: Dialog.Message },
  GotComboboxMessage: { message: CityCombobox.Message },
})
type Message = typeof Message.Type

const foldDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

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

const FilterDialog = Block.define('FilterDialog', {
  Model,
  Message,
})

const dialog = FilterDialog.bindChild(Dialog.block, {
  field: 'dialog',
  parentMessage: Message.GotDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
})

const combobox = FilterDialog.bindChild(CityCombobox, {
  field: 'combobox',
  parentMessage: Message.GotComboboxMessage,
  outMessage: { fold: foldComboboxOutMessage },
})

const init = FilterDialog.init(() => {
  const dialogInit = dialog.init({ id: 'edit-filters' })
  const comboboxInit = combobox.init({ id: 'city' })

  return {
    model: {
      dialog: dialogInit.model,
      combobox: comboboxInit.model,
      maybeCity: Option.none(),
      // ...your other fields
    },
    commands: [
      ...(dialogInit.commands ?? []),
      ...(comboboxInit.commands ?? []),
    ],
  }
})

const FilterDialogComposition = FilterDialog.toComposition({
  children: [dialog, combobox],
})

const update = FilterDialog.update((model, message) =>
  Message.match(message, {
    GotDialogMessage: ({ message }) => dialog.fold(model, message),
    GotComboboxMessage: ({ message }) => combobox.fold(model, message),
  }),
)

// Render the overlay inside the dialog panel. Its panel portals into the
// dialog, so it renders above the dialog content with no extra anchor config.
// Give the panel `relative` so it paints above the Dialog backdrop, and the
// Combobox wrapper `relative` so the input stays above the Combobox backdrop,
// which goes directly before that wrapper.
const view = FilterDialogComposition.view((model, h) => {
  const dialogView = ({
    dialog,
    backdrop,
    panel,
    title,
    isVisible,
  }: DialogRenderInfo) =>
    h.dialog(
      [...dialog],
      isVisible
        ? [
            h.div([...backdrop, h.Class('fixed inset-0 bg-black/50')]),
            h.div(
              [
                ...panel,
                h.Class('relative rounded-lg p-6 max-w-md mx-auto shadow-xl'),
              ],
              [
                h.h2([...title], ['Edit filters']),
                h.block(
                  combobox.embedView({
                    slotId: model.combobox.id,
                    model: model.combobox,
                    viewInputs: {
                      items: cities,
                      itemToConfig: city => ({ content: h.span([], [city]) }),
                      itemToValue: city => city,
                      itemToDisplayText: city => city,
                      className: 'relative w-full',
                      maybeSelectedValue: model.maybeCity,
                      restingInputValue: Option.getOrElse(
                        model.maybeCity,
                        () => '',
                      ),
                      anchor: { placement: 'bottom-start' },
                    },
                  }),
                ),
              ],
            ),
          ]
        : [],
    )

  return h.block(
    dialog.embedView({
      slotId: model.dialog.id,
      model: model.dialog,
      viewInputs: {
        toView: dialogView,
      },
    }),
  )
})
