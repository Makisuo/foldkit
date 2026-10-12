import { Option, Schema } from 'effect'
import type * as Command from 'foldkit/command'
import type * as Mount from 'foldkit/mount'
import { modifyFields } from 'foldkit/struct'
import * as Submodel from 'foldkit/submodel'
import type * as Update from 'foldkit/update'

import type * as Animation from '../animation/public.js'
import {
  type BaseInitConfig,
  BaseModel,
  type BaseViewInputsCommon,
  type ClickItem,
  type DetectMovementOrAnimationEnd,
  EffectsLayer,
  type FocusInput,
  type InertOthers,
  type LockScroll,
  Message,
  type MessageSchema,
  OutMessage,
  type OutMessageSchema,
  type RestoreInert,
  type ScrollItemIntoView,
  type UnlockScroll,
  baseInit,
  closedBaseModel,
  makeMessage,
  makeOutMessage,
  makeUpdate,
  makeView,
  mounts,
} from './shared.js'

// MODEL

/** Schema for the single-select combobox's private interaction state (open/closed status, active item, activation trigger, typed input value). The selection is owned by the parent and passed in via `ViewInputs.maybeSelectedValue`. */
export const Model = Schema.Struct({
  ...BaseModel.fields,
})

export type Model = typeof Model.Type

// INIT

/** Configuration for creating a single-select combobox model with `init`. `isAnimated` enables CSS transition coordination (default `false`). `isModal` locks page scroll and inerts other elements when open (default `false`). */
export type InitConfig = BaseInitConfig

/** Creates an initial single-select combobox model from a config. Defaults to closed with no active item and an empty input. */
export const init = (config: InitConfig): Model => baseInit(config)

// UPDATE

/** Processes a Combobox Message and returns the next Model, optional Commands,
 *  and an optional OutMessage. Selection closes the Combobox and emits
 *  `Selected({ value })` for the parent to store. A nullable Combobox also
 *  emits `ClearedSelection` when it closes with an empty input. */
export const update = makeUpdate<Model, string>(Message, 'CloseWithFocus', {
  handleClose: (model, restingInputValue, isClearable) => {
    if (isClearable && model.nullable && model.inputValue === '') {
      return {
        model: modifyFields(closedBaseModel(model), { inputValue: () => '' }),
        outMessage: OutMessage.ClearedSelection(),
      }
    }

    return {
      model: modifyFields(closedBaseModel(model), {
        inputValue: () => restingInputValue,
      }),
    }
  },

  handleSelectedItem: (model, item, displayText, wasSelected) => {
    const nullableDeselect = model.nullable && wasSelected

    return {
      model: modifyFields(closedBaseModel(model), {
        inputValue: () => (nullableDeselect ? '' : displayText),
      }),
      outMessage: OutMessage.Selected({ value: item }),
    }
  },

  handleImmediateActivation: (model, item) => ({
    model,
    outMessage: OutMessage.Selected({ value: item }),
  }),
})

type UpdateReturn = ReturnType<typeof update>

/** Programmatically opens the Combobox, updating the Model and returning
 *  focus and modal Commands. Use this in domain-event handlers. */
export const open = (model: Model): UpdateReturn =>
  update(model, Message.Opened({ maybeActiveItemIndex: Option.none() }))

/** Programmatically closes the Combobox, updating the Model and returning
 *  focus and modal Commands. `restingInputValue` is the text the input
 *  returns to (the parent-owned selection's display text, or empty). Use
 *  this in domain-event handlers to close the combobox. */
export const close = (model: Model, restingInputValue: string): UpdateReturn =>
  update(model, Message.Closed({ restingInputValue, isClearable: true }))

/** Programmatically selects an item in the single-select combobox, closing
 *  the combobox and emitting `Selected({ value })`. The Submodel treats the
 *  select as fresh (`wasSelected: false`), so the input rests on
 *  `displayText`; what the selection becomes is the parent's fold to decide,
 *  and a parent that toggles on its own state will still deselect an
 *  already-selected value. */
export const selectItem = (
  model: Model,
  item: string,
  displayText: string,
): UpdateReturn =>
  update(model, Message.SelectedItem({ item, displayText, wasSelected: false }))

// VIEW

/** Per-render view inputs passed to the view via `h.submodel`'s `viewInputs` field. */
export type ViewInputs<Item extends string> = BaseViewInputsCommon<Item> &
  Readonly<{
    /** The selection the parent owns, passed in fresh on every render.
     *  `Option` because a single-select combobox may have no selection
     *  yet. Marks the selected item and drives the hidden form input
     *  submitted under `formName`. */
    maybeSelectedValue: Option.Option<Item>
  }>

const SingleOwner = Submodel.owner('Foldkit/Combobox/Single')

/** A complete single-select Combobox descriptor refined to one Item Schema. */
export type Bundle<Item extends string = string> = Submodel.Descriptor<
  Submodel.Owner<'Foldkit/Combobox/Single'>,
  typeof Model,
  MessageSchema<Item>,
  OutMessageSchema<Item>,
  typeof mounts,
  readonly [],
  Readonly<{
    view: Submodel.View<
      Model,
      Message<Item>,
      ViewInputs<Item>,
      Mount.RequirementsOf<typeof mounts>
    >
    init: (config: InitConfig) => Readonly<{ model: Model }>
    update: (
      model: Model,
      message: Message<Item>,
    ) => Update.ReturnWithOutMessage<
      Model,
      Message<Item>,
      OutMessage<Item>,
      | Command.HandlerOf<typeof LockScroll>
      | Command.HandlerOf<typeof UnlockScroll>
      | Command.HandlerOf<typeof InertOthers>
      | Command.HandlerOf<typeof RestoreInert>
      | Command.HandlerOf<typeof FocusInput>
      | Command.HandlerOf<typeof ScrollItemIntoView>
      | Command.HandlerOf<typeof ClickItem>
      | Command.HandlerOf<typeof DetectMovementOrAnimationEnd>
      | Update.RequirementsOf<typeof Animation.update>
    >
    steps: Readonly<{
      open: (
        model: Model,
      ) => Update.ReturnWithOutMessage<
        Model,
        Message<Item>,
        OutMessage<Item>,
        | Command.HandlerOf<typeof LockScroll>
        | Command.HandlerOf<typeof UnlockScroll>
        | Command.HandlerOf<typeof InertOthers>
        | Command.HandlerOf<typeof RestoreInert>
        | Command.HandlerOf<typeof FocusInput>
        | Command.HandlerOf<typeof ScrollItemIntoView>
        | Command.HandlerOf<typeof ClickItem>
        | Command.HandlerOf<typeof DetectMovementOrAnimationEnd>
        | Update.RequirementsOf<typeof Animation.update>
      >
      close: (
        model: Model,
        restingInputValue: string,
      ) => Update.ReturnWithOutMessage<
        Model,
        Message<Item>,
        OutMessage<Item>,
        | Command.HandlerOf<typeof LockScroll>
        | Command.HandlerOf<typeof UnlockScroll>
        | Command.HandlerOf<typeof InertOthers>
        | Command.HandlerOf<typeof RestoreInert>
        | Command.HandlerOf<typeof FocusInput>
        | Command.HandlerOf<typeof ScrollItemIntoView>
        | Command.HandlerOf<typeof ClickItem>
        | Command.HandlerOf<typeof DetectMovementOrAnimationEnd>
        | Update.RequirementsOf<typeof Animation.update>
      >
      selectItem: (
        model: Model,
        item: Item,
        displayText: string,
      ) => Update.ReturnWithOutMessage<
        Model,
        Message<Item>,
        OutMessage<Item>,
        | Command.HandlerOf<typeof LockScroll>
        | Command.HandlerOf<typeof UnlockScroll>
        | Command.HandlerOf<typeof InertOthers>
        | Command.HandlerOf<typeof RestoreInert>
        | Command.HandlerOf<typeof FocusInput>
        | Command.HandlerOf<typeof ScrollItemIntoView>
        | Command.HandlerOf<typeof ClickItem>
        | Command.HandlerOf<typeof DetectMovementOrAnimationEnd>
        | Update.RequirementsOf<typeof Animation.update>
      >
    }>
    EffectsLayer: typeof EffectsLayer
  }>
>

const makeDescriptor = <Item extends string>(
  Item: Schema.Schema<Item>,
): Bundle<Item> => {
  const ItemMessage = makeMessage(Item)
  const ItemOutMessage = makeOutMessage(Item)
  const definition = SingleOwner.define({
    Model,
    Message: ItemMessage,
    OutMessage: ItemOutMessage,
    mounts,
  })
  const update = definition.defineUpdate(
    makeUpdate<Model, Item>(ItemMessage, 'CloseWithFocus', {
      handleClose: (model, restingInputValue, isClearable) => {
        if (isClearable && model.nullable && model.inputValue === '') {
          return {
            model: modifyFields(closedBaseModel(model), {
              inputValue: () => '',
            }),
            outMessage: ItemOutMessage.ClearedSelection(),
          }
        }

        return {
          model: modifyFields(closedBaseModel(model), {
            inputValue: () => restingInputValue,
          }),
        }
      },
      handleSelectedItem: (model, item, displayText, wasSelected) => {
        const nullableDeselect = model.nullable && wasSelected

        return {
          model: modifyFields(closedBaseModel(model), {
            inputValue: () => (nullableDeselect ? '' : displayText),
          }),
          outMessage: ItemOutMessage.Selected({ value: item }),
        }
      },
      handleImmediateActivation: (model, item) => ({
        model,
        outMessage: ItemOutMessage.Selected({ value: item }),
      }),
    }),
  )
  const render = makeView<Model, Item>(
    { ariaMultiSelectable: false },
    ItemMessage,
  )
  const view = definition.defineView.withInputs<ViewInputs<Item>>(
    (model, { maybeSelectedValue, ...baseInputs }, h) =>
      render(
        model,
        {
          ...baseInputs,
          selectedValues: Option.toArray(maybeSelectedValue),
        },
        h,
      ),
  )
  const open = definition.defineStep((model: Model) =>
    update(model, ItemMessage.Opened({ maybeActiveItemIndex: Option.none() })),
  )
  const close = definition.defineStep(
    (model: Model, restingInputValue: string) =>
      update(
        model,
        ItemMessage.Closed({ restingInputValue, isClearable: true }),
      ),
  )
  const selectItem = definition.defineStep(
    (model: Model, item: Item, displayText: string) =>
      update(
        model,
        ItemMessage.SelectedItem({
          item,
          displayText,
          wasSelected: false,
        }),
      ),
  )

  return definition.compose({
    view,
    init: (config: InitConfig) => ({ model: init(config) }),
    update,
    steps: { open, close, selectItem },
    EffectsLayer,
  })
}

/** Creates a checked single-select Combobox descriptor. Pass an Item Schema to
 * retain its exact Message and OutMessage payloads. */
export function create(): Bundle<string>
export function create<Item extends string>(
  Item: Schema.Schema<Item>,
): Bundle<Item>
export function create(Item: Schema.Schema<string> = Schema.String) {
  return makeDescriptor(Item)
}
