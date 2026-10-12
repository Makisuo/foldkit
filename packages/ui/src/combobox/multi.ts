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
  type BaseViewInputs,
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

/** Schema for the multi-select combobox's private interaction state (open/closed status, active item, activation trigger, typed input value). The selection is owned by the parent and passed in via `ViewInputs.selectedValues`. */
export const Model = Schema.Struct({
  ...BaseModel.fields,
})

export type Model = typeof Model.Type

// INIT

/** Configuration for creating a multi-select combobox model with `init`. `isAnimated` enables CSS transition coordination (default `false`). `isModal` locks page scroll and inerts other elements when open (default `false`). */
export type InitConfig = BaseInitConfig

/** Creates an initial multi-select combobox model from a config. Defaults to closed with no active item and an empty input. */
export const init = (config: InitConfig): Model => baseInit(config)

// UPDATE

/** Processes a Combobox Message and returns the next Model, optional Commands,
 *  and an optional OutMessage. Selection leaves the multi-select Combobox open
 *  and emits `Selected({ value })` for the parent to fold by toggling
 *  membership.
 *  Closing never emits `ClearedSelection` because its input rests empty by
 *  design. Clear the selection by toggling each value off. */
export const update = makeUpdate<Model, string>(Message, 'KeepOpen', {
  handleClose: model => ({
    model: modifyFields(closedBaseModel(model), { inputValue: () => '' }),
  }),

  handleSelectedItem: (model, item) => ({
    model,
    outMessage: OutMessage.Selected({ value: item }),
  }),

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
 *  focus and modal Commands. The multi-select input always rests empty on
 *  close. Use this in domain-event handlers to close the combobox. */
export const close = (model: Model): UpdateReturn =>
  update(model, Message.Closed({ restingInputValue: '', isClearable: true }))

/** Programmatically activates an item in the multi-select combobox. Emits
 *  `Selected({ value })`; the parent toggles the value's membership. */
export const selectItem = (model: Model, item: string): UpdateReturn =>
  update(
    model,
    Message.SelectedItem({ item, displayText: item, wasSelected: false }),
  )

// VIEW

/** Per-render view inputs passed to the view via `h.submodel`'s `viewInputs` field. */
export type ViewInputs<Item extends string> = BaseViewInputs<Item>

const MultiOwner = Submodel.owner('Foldkit/Combobox/Multi')

/** A complete multi-select Combobox descriptor refined to one Item Schema. */
export type Bundle<Item extends string = string> = Submodel.Descriptor<
  Submodel.Owner<'Foldkit/Combobox/Multi'>,
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
  const definition = MultiOwner.define({
    Model,
    Message: ItemMessage,
    OutMessage: ItemOutMessage,
    mounts,
  })
  const update = definition.defineUpdate(
    makeUpdate<Model, Item>(ItemMessage, 'KeepOpen', {
      handleClose: model => ({
        model: modifyFields(closedBaseModel(model), { inputValue: () => '' }),
      }),
      handleSelectedItem: (model, item) => ({
        model,
        outMessage: ItemOutMessage.Selected({ value: item }),
      }),
      handleImmediateActivation: (model, item) => ({
        model,
        outMessage: ItemOutMessage.Selected({ value: item }),
      }),
    }),
  )
  const view = definition.defineView.withInputs<ViewInputs<Item>>(
    makeView<Model, Item>({ ariaMultiSelectable: true }, ItemMessage),
  )
  const open = definition.defineStep((model: Model) =>
    update(model, ItemMessage.Opened({ maybeActiveItemIndex: Option.none() })),
  )
  const close = definition.defineStep((model: Model) =>
    update(
      model,
      ItemMessage.Closed({ restingInputValue: '', isClearable: true }),
    ),
  )
  const selectItem = definition.defineStep((model: Model, item: Item) =>
    update(
      model,
      ItemMessage.SelectedItem({
        item,
        displayText: item,
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

/** Creates a checked multi-select Combobox descriptor. Pass an Item Schema to
 * retain its exact Message and OutMessage payloads. */
export function create(): Bundle<string>
export function create<Item extends string>(
  Item: Schema.Schema<Item>,
): Bundle<Item>
export function create(Item: Schema.Schema<string> = Schema.String) {
  return makeDescriptor(Item)
}
