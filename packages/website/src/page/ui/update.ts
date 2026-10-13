import { Array, Match, Number, Option, Schema, pipe } from 'effect'
import { Block, Update } from 'foldkit'
import { defineTaggedUnion } from 'foldkit/schema'
import { modifyFields } from 'foldkit/struct'

import {
  Animation,
  Calendar,
  DatePicker,
  Dialog,
  DragAndDrop,
  FileDrop,
  HoverIntent,
  Popover,
  Slider,
  Tooltip,
  VirtualList,
} from '@foldkit/ui'
import { defaultLeaveCommand } from '@foldkit/ui/animation'
import { DragState } from '@foldkit/ui/dragAndDrop'

import { CityCombobox, CityMultiCombobox } from './combobox'
import { CharacterListbox, ItemListbox, ItemMultiListbox } from './demo/listbox'
import { DemoMenu } from './demo/menu'
import { PlanRadioGroup } from './demo/radioGroup'
import { DemoTabs } from './demo/tabs'
import { Toast } from './demo/toastModule'
import {
  type Activity,
  ROW_COUNT as VIRTUAL_LIST_ROW_COUNT,
} from './demo/virtualList'
import { Message } from './message'
import { Model, VirtualListChatStartProximity } from './model'
import type { DemoCard, DemoColumn, VirtualListChatMessage } from './model'

export const Ui = Block.define('Ui', {
  Model,
  Message,
})

// REORDER

const reorderColumns = (
  columns: ReadonlyArray<typeof DemoColumn.Type>,
  itemId: string,
  fromContainerId: string,
  toContainerId: string,
  toIndex: number,
): ReadonlyArray<typeof DemoColumn.Type> => {
  const maybeCard: Option.Option<typeof DemoCard.Type> = pipe(
    columns,
    Array.findFirst(({ id }) => id === fromContainerId),
    Option.flatMap(column =>
      Array.findFirst(column.cards, ({ id }) => id === itemId),
    ),
  )

  return Option.match(maybeCard, {
    onNone: () => columns,
    onSome: card =>
      Array.map(columns, column => {
        const withRemoved =
          column.id === fromContainerId
            ? Array.filter(column.cards, ({ id }) => id !== itemId)
            : column.cards

        if (column.id !== toContainerId) {
          return modifyFields(column, { cards: () => withRemoved })
        }

        const inserted = pipe(withRemoved, cards => [
          ...Array.take(cards, toIndex),
          card,
          ...Array.drop(cards, toIndex),
        ])

        return modifyFields(column, { cards: () => inserted })
      }),
  })
}

const findDragAndDropDemoCardLabel = (
  columns: ReadonlyArray<typeof DemoColumn.Type>,
  itemId: string,
): string =>
  pipe(
    columns,
    Array.flatMap(column => column.cards),
    Array.findFirst(card => card.id === itemId),
    Option.match({
      onNone: () => itemId,
      onSome: card => card.label,
    }),
  )

const findDragAndDropDemoColumnLabel = (
  columns: ReadonlyArray<typeof DemoColumn.Type>,
  containerId: string,
): string =>
  pipe(
    columns,
    Array.findFirst(column => column.id === containerId),
    Option.match({
      onNone: () => containerId,
      onSome: column => column.label,
    }),
  )

const DragAndDropDemoAnnouncement = defineTaggedUnion({
  PickedUp: { label: Schema.String },
  MovedToColumn: { columnLabel: Schema.String, position: Schema.Number },
  MovedWithinColumn: { columnLabel: Schema.String, position: Schema.Number },
  Dropped: {
    label: Schema.String,
    columnLabel: Schema.String,
    position: Schema.Number,
  },
  Cancelled: {},
})
type DragAndDropDemoAnnouncement = typeof DragAndDropDemoAnnouncement.Type

const dragAndDropDemoAnnouncementToText = DragAndDropDemoAnnouncement.match({
  PickedUp: ({ label }) =>
    `Picked up ${label}. Use arrow keys to move within a column, Tab to move between columns, Space to drop, Escape to cancel.`,
  MovedToColumn: ({ columnLabel, position }) =>
    `Moved to ${columnLabel}, position ${position}.`,
  MovedWithinColumn: ({ columnLabel, position }) =>
    `Position ${position} in ${columnLabel}.`,
  Dropped: ({ label, columnLabel, position }) =>
    `Dropped ${label} in position ${position} of ${columnLabel}.`,
  Cancelled: () => 'Drag cancelled.',
})

const maybeDragAndDropDemoKeyboardAnnouncement = (
  model: Model,
  nextDragAndDrop: typeof DragAndDrop.Model.Type,
): Option.Option<DragAndDropDemoAnnouncement> =>
  DragState.matchOrElse<Option.Option<DragAndDropDemoAnnouncement>>(
    nextDragAndDrop.dragState,
    {
      KeyboardDragging: nextState =>
        DragState.matchOrElse<Option.Option<DragAndDropDemoAnnouncement>>(
          model.dragAndDropDemo.dragState,
          {
            Idle: () =>
              Option.some(
                DragAndDropDemoAnnouncement.PickedUp({
                  label: findDragAndDropDemoCardLabel(
                    model.dragAndDropDemoColumns,
                    nextState.itemId,
                  ),
                }),
              ),
            KeyboardDragging: previousState => {
              const columnLabel = findDragAndDropDemoColumnLabel(
                model.dragAndDropDemoColumns,
                nextState.targetContainerId,
              )
              const position = nextState.targetIndex + 1

              if (
                previousState.targetContainerId !== nextState.targetContainerId
              ) {
                return Option.some(
                  DragAndDropDemoAnnouncement.MovedToColumn({
                    columnLabel,
                    position,
                  }),
                )
              }

              if (previousState.targetIndex !== nextState.targetIndex) {
                return Option.some(
                  DragAndDropDemoAnnouncement.MovedWithinColumn({
                    columnLabel,
                    position,
                  }),
                )
              }

              return Option.none()
            },
          },
          () => Option.none(),
        ),
    },
    () => Option.none(),
  )

// CHILD FOLDS

const foldDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

const foldMenuOutMessage = DemoMenu.OutMessage.match<
  Update.Step<Model, Message>,
  typeof DemoMenu.OutMessage.Type
>({
  Selected: () => model => ({ model }),
})

const foldPopoverOutMessage = Popover.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

const foldCalendarBasicDemoOutMessage = Calendar.OutMessage.match<
  Update.Step<Model, Message>
>({
  SelectedDate:
    ({ date }) =>
    model => ({
      model: modifyFields(model, {
        maybeCalendarBasicDemoSelectedDate: () => Option.some(date),
      }),
    }),
  ChangedViewMonth: () => model => ({ model }),
})

export const calendarBasicDemo = Calendar.block.connection({
  Model,
  field: 'calendarBasicDemo',
  parentMessage: Message.GotCalendarBasicDemoMessage,
  outMessage: { fold: foldCalendarBasicDemoOutMessage },
})

const foldDatePickerBasicDemoOutMessage = DatePicker.OutMessage.match<
  Update.Step<Model, Message>
>({
  SelectedDate:
    ({ date }) =>
    model => ({
      model: modifyFields(model, {
        maybeDatePickerBasicDemoSelectedDate: () => Option.some(date),
      }),
    }),
  ClearedDate: () => model => ({
    model: modifyFields(model, {
      maybeDatePickerBasicDemoSelectedDate: () => Option.none(),
    }),
  }),
  ChangedViewMonth: () => model => ({ model }),
})

export const datePickerBasicDemo = DatePicker.block.connection({
  Model,
  field: 'datePickerBasicDemo',
  parentMessage: Message.GotDatePickerBasicDemoMessage,
  outMessage: { fold: foldDatePickerBasicDemoOutMessage },
})

const foldComboboxDemoOutMessage = CityCombobox.OutMessage.match<
  Update.Step<Model, Message>,
  typeof CityCombobox.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        maybeComboboxDemoSelectedCity: () => Option.some(value),
      }),
    }),
  ClearedSelection: () => model => ({ model }),
})

export const comboboxDemo = CityCombobox.connection({
  Model,
  field: 'comboboxDemo',
  parentMessage: Message.GotComboboxDemoMessage,
  outMessage: { fold: foldComboboxDemoOutMessage },
})

const foldComboboxPlacementLockDemoOutMessage = CityCombobox.OutMessage.match<
  Update.Step<Model, Message>,
  typeof CityCombobox.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        maybeComboboxPlacementLockDemoSelectedCity: () => Option.some(value),
      }),
    }),
  ClearedSelection: () => model => ({ model }),
})

export const comboboxPlacementLockDemo = CityCombobox.connection({
  Model,
  field: 'comboboxPlacementLockDemo',
  parentMessage: Message.GotComboboxPlacementLockDemoMessage,
  outMessage: { fold: foldComboboxPlacementLockDemoOutMessage },
})

const foldComboboxNullableDemoOutMessage = CityCombobox.OutMessage.match<
  Update.Step<Model, Message>,
  typeof CityCombobox.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        maybeComboboxNullableDemoSelectedCity:
          maybeComboboxNullableDemoSelectedCity =>
            Option.contains(maybeComboboxNullableDemoSelectedCity, value)
              ? Option.none()
              : Option.some(value),
      }),
    }),
  ClearedSelection: () => model => ({
    model: modifyFields(model, {
      maybeComboboxNullableDemoSelectedCity: () => Option.none(),
    }),
  }),
})

export const comboboxNullableDemo = CityCombobox.connection({
  Model,
  field: 'comboboxNullableDemo',
  parentMessage: Message.GotComboboxNullableDemoMessage,
  outMessage: { fold: foldComboboxNullableDemoOutMessage },
})

const foldComboboxMultiDemoOutMessage = CityMultiCombobox.OutMessage.match<
  Update.Step<Model, Message>,
  typeof CityMultiCombobox.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        comboboxMultiDemoSelectedCities: comboboxMultiDemoSelectedCities =>
          Array.contains(comboboxMultiDemoSelectedCities, value)
            ? Array.filter(
                comboboxMultiDemoSelectedCities,
                city => city !== value,
              )
            : Array.append(comboboxMultiDemoSelectedCities, value),
      }),
    }),
  ClearedSelection: () => model => ({ model }),
})

export const comboboxMultiDemo = CityMultiCombobox.connection({
  Model,
  field: 'comboboxMultiDemo',
  parentMessage: Message.GotComboboxMultiDemoMessage,
  outMessage: { fold: foldComboboxMultiDemoOutMessage },
})

const foldComboboxSelectOnFocusDemoOutMessage = CityCombobox.OutMessage.match<
  Update.Step<Model, Message>,
  typeof CityCombobox.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        maybeComboboxSelectOnFocusDemoSelectedCity: () => Option.some(value),
      }),
    }),
  ClearedSelection: () => model => ({ model }),
})

export const comboboxSelectOnFocusDemo = CityCombobox.connection({
  Model,
  field: 'comboboxSelectOnFocusDemo',
  parentMessage: Message.GotComboboxSelectOnFocusDemoMessage,
  outMessage: { fold: foldComboboxSelectOnFocusDemoOutMessage },
})

const readDialogDemo = (
  model: Model,
): Option.Option<typeof Dialog.Model.Type> => Option.some(model.dialogDemo)

const writeDialogDemo = (
  model: Model,
  nextDialogDemo: typeof Dialog.Model.Type,
): Model => modifyFields(model, { dialogDemo: () => nextDialogDemo })

const toGotDialogDemoMessage = (message: typeof Dialog.Message.Type): Message =>
  Message.GotDialogDemoMessage({ message })

export const dialogDemo = Dialog.block.connection({
  placement: 'dialog-demo',
  read: readDialogDemo,
  write: writeDialogDemo,
  toParentMessage: toGotDialogDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
})

const readDialogAnimatedDemo = (
  model: Model,
): Option.Option<typeof Dialog.Model.Type> =>
  Option.some(model.dialogAnimatedDemo)

const writeDialogAnimatedDemo = (
  model: Model,
  nextDialogAnimatedDemo: typeof Dialog.Model.Type,
): Model =>
  modifyFields(model, { dialogAnimatedDemo: () => nextDialogAnimatedDemo })

const toGotDialogAnimatedDemoMessage = (
  message: typeof Dialog.Message.Type,
): Message => Message.GotDialogAnimatedDemoMessage({ message })

export const dialogAnimatedDemo = Dialog.block.connection({
  placement: 'dialog-animated-demo',
  read: readDialogAnimatedDemo,
  write: writeDialogAnimatedDemo,
  toParentMessage: toGotDialogAnimatedDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
})

const readOverlayDialogDemo = (
  model: Model,
): Option.Option<typeof Dialog.Model.Type> =>
  Option.some(model.overlayDialogDemo)

const writeOverlayDialogDemo = (
  model: Model,
  nextOverlayDialogDemo: typeof Dialog.Model.Type,
): Model =>
  modifyFields(model, { overlayDialogDemo: () => nextOverlayDialogDemo })

const toGotOverlayDialogDemoMessage = (
  message: typeof Dialog.Message.Type,
): Message => Message.GotOverlayDialogDemoMessage({ message })

export const overlayDialogDemo = Dialog.block.connection({
  placement: 'overlay-dialog-demo',
  read: readOverlayDialogDemo,
  write: writeOverlayDialogDemo,
  toParentMessage: toGotOverlayDialogDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
})

const foldOverlayComboboxDemoOutMessage = CityCombobox.OutMessage.match<
  Update.Step<Model, Message>,
  typeof CityCombobox.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        maybeOverlayComboboxDemoSelectedCity: () => Option.some(value),
      }),
    }),
  ClearedSelection: () => model => ({ model }),
})

export const overlayComboboxDemo = CityCombobox.connection({
  Model,
  field: 'overlayComboboxDemo',
  parentMessage: Message.GotOverlayComboboxDemoMessage,
  outMessage: { fold: foldOverlayComboboxDemoOutMessage },
})

const readNestedDialogParentDemo = (
  model: Model,
): Option.Option<typeof Dialog.Model.Type> =>
  Option.some(model.nestedDialogParentDemo)

const writeNestedDialogParentDemo = (
  model: Model,
  nextNestedDialogParentDemo: typeof Dialog.Model.Type,
): Model =>
  modifyFields(model, {
    nestedDialogParentDemo: () => nextNestedDialogParentDemo,
  })

const toGotNestedDialogParentDemoMessage = (
  message: typeof Dialog.Message.Type,
): Message => Message.GotNestedDialogParentDemoMessage({ message })

export const nestedDialogParentDemo = Dialog.block.connection({
  placement: 'nested-dialog-parent-demo',
  read: readNestedDialogParentDemo,
  write: writeNestedDialogParentDemo,
  toParentMessage: toGotNestedDialogParentDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
})

const readNestedDialogChildDemo = (
  model: Model,
): Option.Option<typeof Dialog.Model.Type> =>
  Option.some(model.nestedDialogChildDemo)

const writeNestedDialogChildDemo = (
  model: Model,
  nextNestedDialogChildDemo: typeof Dialog.Model.Type,
): Model =>
  modifyFields(model, {
    nestedDialogChildDemo: () => nextNestedDialogChildDemo,
  })

const toGotNestedDialogChildDemoMessage = (
  message: typeof Dialog.Message.Type,
): Message => Message.GotNestedDialogChildDemoMessage({ message })

export const nestedDialogChildDemo = Dialog.block.connection({
  placement: 'nested-dialog-child-demo',
  read: readNestedDialogChildDemo,
  write: writeNestedDialogChildDemo,
  toParentMessage: toGotNestedDialogChildDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
})

const foldListboxDemoOutMessage = ItemListbox.OutMessage.match<
  Update.Step<Model, Message>,
  typeof ItemListbox.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        maybeListboxDemoSelectedItem: () => Option.some(value),
      }),
    }),
})

export const listboxDemo = ItemListbox.connection({
  Model,
  field: 'listboxDemo',
  parentMessage: Message.GotListboxDemoMessage,
  outMessage: { fold: foldListboxDemoOutMessage },
})

const foldListboxMultiDemoOutMessage = ItemMultiListbox.OutMessage.match<
  Update.Step<Model, Message>,
  typeof ItemMultiListbox.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        listboxMultiDemoSelectedItems: listboxMultiDemoSelectedItems =>
          Array.contains(listboxMultiDemoSelectedItems, value)
            ? Array.filter(
                listboxMultiDemoSelectedItems,
                item => item !== value,
              )
            : Array.append(listboxMultiDemoSelectedItems, value),
      }),
    }),
})

export const listboxMultiDemo = ItemMultiListbox.connection({
  Model,
  field: 'listboxMultiDemo',
  parentMessage: Message.GotListboxMultiDemoMessage,
  outMessage: { fold: foldListboxMultiDemoOutMessage },
})

const foldListboxGroupedDemoOutMessage = CharacterListbox.OutMessage.match<
  Update.Step<Model, Message>,
  typeof CharacterListbox.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        maybeListboxGroupedDemoSelectedItem: () => Option.some(value),
      }),
    }),
})

export const listboxGroupedDemo = CharacterListbox.connection({
  Model,
  field: 'listboxGroupedDemo',
  parentMessage: Message.GotListboxGroupedDemoMessage,
  outMessage: { fold: foldListboxGroupedDemoOutMessage },
})

export const menuBasicDemo = DemoMenu.connection({
  Model,
  field: 'menuBasicDemo',
  parentMessage: Message.GotMenuBasicDemoMessage,
  outMessage: { fold: foldMenuOutMessage },
})

export const menuAnimatedDemo = DemoMenu.connection({
  Model,
  field: 'menuAnimatedDemo',
  parentMessage: Message.GotMenuAnimatedDemoMessage,
  outMessage: { fold: foldMenuOutMessage },
})

export const popoverBasicDemo = Popover.block.connection({
  Model,
  field: 'popoverBasicDemo',
  parentMessage: Message.GotPopoverBasicDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

export const popoverAnimatedDemo = Popover.block.connection({
  Model,
  field: 'popoverAnimatedDemo',
  parentMessage: Message.GotPopoverAnimatedDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

export const popoverArrowDemo = Popover.block.connection({
  Model,
  field: 'popoverArrowDemo',
  parentMessage: Message.GotPopoverArrowDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

export const popoverNestedParentDemo = Popover.block.connection({
  Model,
  field: 'popoverNestedParentDemo',
  parentMessage: Message.GotPopoverNestedParentDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

export const popoverNestedChildDemo = Popover.block.connection({
  Model,
  field: 'popoverNestedChildDemo',
  parentMessage: Message.GotPopoverNestedChildDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

const foldSliderRatingDemoOutMessage = Slider.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedValue:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { sliderRatingValue: () => value }),
    }),
})

export const sliderRatingDemo = Slider.block.connection({
  Model,
  field: 'sliderRatingDemo',
  parentMessage: Message.GotSliderRatingDemoMessage,
  outMessage: { fold: foldSliderRatingDemoOutMessage },
})

const foldSliderVolumeDemoOutMessage = Slider.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedValue:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { sliderVolumeValue: () => value }),
    }),
})

export const sliderVolumeDemo = Slider.block.connection({
  Model,
  field: 'sliderVolumeDemo',
  parentMessage: Message.GotSliderVolumeDemoMessage,
  outMessage: { fold: foldSliderVolumeDemoOutMessage },
})

const foldHorizontalTabsDemoOutMessage = DemoTabs.OutMessage.match<
  Update.Step<Model, Message>,
  typeof DemoTabs.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { horizontalTabsDemoTab: () => value }),
    }),
})

export const horizontalTabsDemo = DemoTabs.connection({
  Model,
  field: 'horizontalTabsDemo',
  parentMessage: Message.GotHorizontalTabsDemoMessage,
  outMessage: { fold: foldHorizontalTabsDemoOutMessage },
})

const foldVerticalTabsDemoOutMessage = DemoTabs.OutMessage.match<
  Update.Step<Model, Message>,
  typeof DemoTabs.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { verticalTabsDemoTab: () => value }),
    }),
})

export const verticalTabsDemo = DemoTabs.connection({
  Model,
  field: 'verticalTabsDemo',
  parentMessage: Message.GotVerticalTabsDemoMessage,
  outMessage: { fold: foldVerticalTabsDemoOutMessage },
})

const foldTooltipOutMessage = Tooltip.OutMessage.match<
  Update.Step<Model, Message>
>({
  Shown: () => model => ({ model }),
  Hidden: () => model => ({ model }),
})

export const tooltipDemo = Tooltip.block.connection({
  Model,
  field: 'tooltipDemo',
  parentMessage: Message.GotTooltipDemoMessage,
  outMessage: { fold: foldTooltipOutMessage },
})

const foldHoverIntentOutMessage = HoverIntent.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

export const hoverIntentCardDemo = HoverIntent.block.connection({
  Model,
  field: 'hoverIntentCardDemo',
  parentMessage: Message.GotHoverIntentCardDemoMessage,
  outMessage: { fold: foldHoverIntentOutMessage },
})

const readHoverIntentMenuDemo = (
  model: Model,
): Option.Option<typeof HoverIntent.Model.Type> =>
  Option.some(model.hoverIntentMenuDemo)

const writeHoverIntentMenuDemo = (
  model: Model,
  nextHoverIntentMenuDemo: typeof HoverIntent.Model.Type,
): Model =>
  modifyFields(model, { hoverIntentMenuDemo: () => nextHoverIntentMenuDemo })

const toGotHoverIntentMenuDemoMessage = (
  message: typeof HoverIntent.Message.Type,
): Message => Message.GotHoverIntentMenuDemoMessage({ message })

export const hoverIntentMenuDemo = HoverIntent.block.connection({
  placement: 'hover-intent-menu-demo',
  read: readHoverIntentMenuDemo,
  write: writeHoverIntentMenuDemo,
  toParentMessage: toGotHoverIntentMenuDemoMessage,
  outMessage: { fold: foldHoverIntentOutMessage },
})

const foldToastDemoOutMessage = Toast.OutMessage.match<
  Update.Step<Model, Message>
>({
  DismissedToast:
    ({ payload }) =>
    model => ({
      model: modifyFields(model, {
        maybeLastDismissedToastTitle: () => Option.some(payload.title),
      }),
    }),
})

const readToastDemo = (model: Model): Option.Option<typeof Toast.Model.Type> =>
  Option.some(model.toastDemo)

const writeToastDemo = (
  model: Model,
  nextToastDemo: typeof Toast.Model.Type,
): Model => modifyFields(model, { toastDemo: () => nextToastDemo })

const toGotToastDemoMessage = (message: typeof Toast.Message.Type): Message =>
  Message.GotToastDemoMessage({ message })

export const toastDemo = Toast.connection({
  placement: 'toast-demo',
  read: readToastDemo,
  write: writeToastDemo,
  toParentMessage: toGotToastDemoMessage,
  outMessage: { fold: foldToastDemoOutMessage },
})

const foldAnimationDemoOutMessage = (
  outMessage: typeof Animation.OutMessage.Type,
  { liftCommand }: Update.FoldContext<typeof Animation.Message.Type, Message>,
) =>
  Animation.OutMessage.match(outMessage, {
    StartedLeaveAnimating: () =>
      Ui.step(model => ({
        model,
        commands: [liftCommand(defaultLeaveCommand(model.animationDemo))],
      })),
    TransitionedOut: () => Ui.step(model => ({ model })),
  })

export const animationDemo = Animation.block.connection({
  Model,
  field: 'animationDemo',
  parentMessage: Message.GotAnimationDemoMessage,
  outMessage: { fold: foldAnimationDemoOutMessage },
})

const foldFileDropBasicDemoOutMessage = FileDrop.OutMessage.match<
  Update.Step<Model, Message>
>({
  ReceivedFiles:
    ({ files }) =>
    model => ({
      model: modifyFields(model, {
        fileDropBasicDemoFiles: Array.appendAll(files),
      }),
    }),
  RejectedNonFiles: () => model => ({ model }),
})

export const fileDropBasicDemo = FileDrop.block.connection({
  Model,
  field: 'fileDropBasicDemo',
  parentMessage: Message.GotFileDropBasicDemoMessage,
  outMessage: { fold: foldFileDropBasicDemoOutMessage },
})

const foldDragAndDropDemoOutMessage = DragAndDrop.OutMessage.match<
  Update.Step<Model, Message>
>({
  Reordered:
    ({ itemId, fromContainerId, toContainerId, toIndex }) =>
    model => {
      const label = findDragAndDropDemoCardLabel(
        model.dragAndDropDemoColumns,
        itemId,
      )
      const columnLabel = findDragAndDropDemoColumnLabel(
        model.dragAndDropDemoColumns,
        toContainerId,
      )

      return {
        model: modifyFields(model, {
          dragAndDropDemoColumns: dragAndDropDemoColumns =>
            reorderColumns(
              dragAndDropDemoColumns,
              itemId,
              fromContainerId,
              toContainerId,
              toIndex,
            ),
          dragAndDropDemoAnnouncement: () =>
            dragAndDropDemoAnnouncementToText(
              DragAndDropDemoAnnouncement.Dropped({
                label,
                columnLabel,
                position: toIndex + 1,
              }),
            ),
        }),
      }
    },
  Cancelled: () => model => ({
    model: modifyFields(model, {
      dragAndDropDemoAnnouncement: () =>
        dragAndDropDemoAnnouncementToText(
          DragAndDropDemoAnnouncement.Cancelled(),
        ),
    }),
  }),
})

export const dragAndDropDemo = DragAndDrop.block.connection({
  placement: 'drag-and-drop-demo',
  read: (model: Model) => Option.some(model.dragAndDropDemo),
  write: (model, nextDragAndDropDemo) =>
    modifyFields(model, {
      dragAndDropDemo: () => nextDragAndDropDemo,
      dragAndDropDemoAnnouncement: dragAndDropDemoAnnouncement =>
        Option.match(
          maybeDragAndDropDemoKeyboardAnnouncement(model, nextDragAndDropDemo),
          {
            onNone: () => dragAndDropDemoAnnouncement,
            onSome: dragAndDropDemoAnnouncementToText,
          },
        ),
    }),
  parentMessage: Message.GotDragAndDropDemoMessage,
  outMessage: { fold: foldDragAndDropDemoOutMessage },
})

const ActivityVirtualList = VirtualList.create<Activity>()
const ChatVirtualList = VirtualList.create<VirtualListChatMessage>()

export const virtualListDemo = ActivityVirtualList.connection({
  Model,
  field: 'virtualListDemo',
  parentMessage: Message.GotVirtualListDemoMessage,
})

export const virtualListVariableDemo = ActivityVirtualList.connection({
  Model,
  field: 'virtualListVariableDemo',
  parentMessage: Message.GotVirtualListVariableDemoMessage,
})

export const virtualListChatDemo = ChatVirtualList.connection({
  Model,
  field: 'virtualListChatDemo',
  parentMessage: Message.GotVirtualListChatDemoMessage,
})

const VIRTUAL_LIST_CHAT_START_THRESHOLD_PX = 48
const VIRTUAL_LIST_CHAT_HISTORY_BATCH_SIZE = 8

const updateVirtualListChatMessages = (
  model: Model,
  nextMessages: ReadonlyArray<VirtualListChatMessage>,
  nextId: number = model.virtualListChatNextId,
) => {
  const nextModel = modifyFields(model, {
    virtualListChatMessages: () => nextMessages,
    virtualListChatNextId: () => nextId,
  })
  return virtualListChatDemo.informItemsChanged(
    Array.map(nextMessages, message => globalThis.String(message.id)),
  )(nextModel)
}

const prependVirtualListChatMessages = (model: Model) => {
  const firstId = pipe(
    model.virtualListChatMessages,
    Array.head,
    Option.match({
      onNone: () => model.virtualListChatNextId,
      onSome: message => message.id,
    }),
  )
  const olderMessages = Array.makeBy(
    VIRTUAL_LIST_CHAT_HISTORY_BATCH_SIZE,
    index => {
      const id = firstId - VIRTUAL_LIST_CHAT_HISTORY_BATCH_SIZE + index
      return {
        id,
        body: `Older message ${id} loaded above the viewport.`,
        isExpanded: id % 3 === 0,
      }
    },
  )
  const nextMessages = [...olderMessages, ...model.virtualListChatMessages]
  return updateVirtualListChatMessages(model, nextMessages)
}

const prependVirtualListChatMessagesOnStartThresholdEntry =
  (scrollTop: number) => (stepModel: Model) => {
    const isNearStart = scrollTop <= VIRTUAL_LIST_CHAT_START_THRESHOLD_PX
    const nextVirtualListChatStartProximity = isNearStart
      ? VirtualListChatStartProximity.Near()
      : VirtualListChatStartProximity.Away()
    const nextModel = modifyFields(stepModel, {
      virtualListChatStartProximity: () => nextVirtualListChatStartProximity,
    })

    if (
      !isNearStart ||
      stepModel.virtualListChatStartProximity._tag === 'Near'
    ) {
      return { model: nextModel }
    }

    return prependVirtualListChatMessages(nextModel)
  }

// UPDATE

const foldVerticalRadioGroupDemoOutMessage = PlanRadioGroup.OutMessage.match<
  Update.Step<Model, Message>,
  typeof PlanRadioGroup.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        verticalRadioGroupDemoValue: () => Option.some(value),
      }),
    }),
})

export const verticalRadioGroupDemo = PlanRadioGroup.connection({
  Model,
  field: 'verticalRadioGroupDemo',
  parentMessage: Message.GotVerticalRadioGroupDemoMessage,
  outMessage: { fold: foldVerticalRadioGroupDemoOutMessage },
})

const foldHorizontalRadioGroupDemoOutMessage = PlanRadioGroup.OutMessage.match<
  Update.Step<Model, Message>,
  typeof PlanRadioGroup.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        horizontalRadioGroupDemoValue: () => Option.some(value),
      }),
    }),
})

export const horizontalRadioGroupDemo = PlanRadioGroup.connection({
  Model,
  field: 'horizontalRadioGroupDemo',
  parentMessage: Message.GotHorizontalRadioGroupDemoMessage,
  outMessage: { fold: foldHorizontalRadioGroupDemoOutMessage },
})

export const ui = Ui.register({
  children: [
    animationDemo,
    calendarBasicDemo,
    comboboxDemo,
    comboboxMultiDemo,
    comboboxNullableDemo,
    comboboxPlacementLockDemo,
    comboboxSelectOnFocusDemo,
    datePickerBasicDemo,
    dialogAnimatedDemo,
    dialogDemo,
    dragAndDropDemo,
    fileDropBasicDemo,
    horizontalRadioGroupDemo,
    horizontalTabsDemo,
    hoverIntentCardDemo,
    hoverIntentMenuDemo,
    listboxDemo,
    listboxGroupedDemo,
    listboxMultiDemo,
    menuAnimatedDemo,
    menuBasicDemo,
    nestedDialogChildDemo,
    nestedDialogParentDemo,
    overlayComboboxDemo,
    overlayDialogDemo,
    popoverAnimatedDemo,
    popoverArrowDemo,
    popoverBasicDemo,
    popoverNestedChildDemo,
    popoverNestedParentDemo,
    sliderRatingDemo,
    sliderVolumeDemo,
    toastDemo,
    tooltipDemo,
    verticalRadioGroupDemo,
    verticalTabsDemo,
    virtualListChatDemo,
    virtualListDemo,
    virtualListVariableDemo,
  ],
})

export const update = Ui.update((model, message) =>
  Message.match(message, {
    UpdatedInputDemoValue: ({ value }) => ({
      model: modifyFields(model, { inputDemoValue: () => value }),
    }),

    UpdatedTextareaDemoValue: ({ value }) => ({
      model: modifyFields(model, { textareaDemoValue: () => value }),
    }),

    UpdatedFieldsetInputValue: ({ value }) => ({
      model: modifyFields(model, { fieldsetInputValue: () => value }),
    }),

    UpdatedFieldsetTextareaValue: ({ value }) => ({
      model: modifyFields(model, { fieldsetTextareaValue: () => value }),
    }),

    UpdatedSelectDemoValue: ({ value }) => ({
      model: modifyFields(model, { selectDemoValue: () => value }),
    }),

    ToggledFieldsetCheckboxDemo: ({ isChecked }) => ({
      model: modifyFields(model, {
        isFieldsetCheckboxDemoChecked: () => isChecked,
      }),
    }),

    ClickedButtonDemo: () => ({
      model: modifyFields(model, {
        buttonClickCount: Number.increment,
      }),
    }),

    GotCalendarBasicDemoMessage: ({ message }) =>
      calendarBasicDemo.fold(model, message),

    GotDatePickerBasicDemoMessage: ({ message }) =>
      datePickerBasicDemo.fold(model, message),

    ToggledCheckboxBasicDemo: ({ isChecked }) => ({
      model: modifyFields(model, {
        isCheckboxBasicDemoChecked: () => isChecked,
      }),
    }),

    ToggledCheckboxAllDemo: ({ isChecked }) => ({
      model: modifyFields(model, {
        isCheckboxOptionADemoChecked: () => isChecked,
        isCheckboxOptionBDemoChecked: () => isChecked,
      }),
    }),

    ToggledCheckboxOptionADemo: ({ isChecked }) => ({
      model: modifyFields(model, {
        isCheckboxOptionADemoChecked: () => isChecked,
      }),
    }),

    ToggledCheckboxOptionBDemo: ({ isChecked }) => ({
      model: modifyFields(model, {
        isCheckboxOptionBDemoChecked: () => isChecked,
      }),
    }),

    GotComboboxDemoMessage: ({ message }) => comboboxDemo.fold(model, message),

    GotComboboxPlacementLockDemoMessage: ({ message }) =>
      comboboxPlacementLockDemo.fold(model, message),

    GotComboboxNullableDemoMessage: ({ message }) =>
      comboboxNullableDemo.fold(model, message),

    GotComboboxMultiDemoMessage: ({ message }) =>
      comboboxMultiDemo.fold(model, message),

    GotComboboxSelectOnFocusDemoMessage: ({ message }) =>
      comboboxSelectOnFocusDemo.fold(model, message),

    GotDialogDemoMessage: ({ message }) => dialogDemo.fold(model, message),

    GotDialogAnimatedDemoMessage: ({ message }) =>
      dialogAnimatedDemo.fold(model, message),

    GotOverlayDialogDemoMessage: ({ message }) =>
      overlayDialogDemo.fold(model, message),

    GotOverlayComboboxDemoMessage: ({ message }) =>
      overlayComboboxDemo.fold(model, message),

    GotNestedDialogParentDemoMessage: ({ message }) =>
      nestedDialogParentDemo.fold(model, message),

    GotNestedDialogChildDemoMessage: ({ message }) =>
      nestedDialogChildDemo.fold(model, message),

    ClickedDeleteProject: () => nestedDialogChildDemo.open()(model),

    ClickedOpenDialog: () => dialogDemo.open()(model),

    ClickedOpenAnimatedDialog: () => dialogAnimatedDemo.open()(model),

    ClickedEditFilters: () => overlayDialogDemo.open()(model),

    ClickedOpenProjectSettings: () => nestedDialogParentDemo.open()(model),

    ToggledDisclosureDemo: ({ isOpen }) => ({
      model: modifyFields(model, { isDisclosureDemoOpen: () => isOpen }),
    }),

    ToggledDisclosureCollapsedPreviewDemo: ({ isOpen }) => ({
      model: modifyFields(model, {
        isDisclosureCollapsedPreviewDemoOpen: () => isOpen,
      }),
    }),

    GotListboxDemoMessage: ({ message }) => listboxDemo.fold(model, message),

    GotListboxMultiDemoMessage: ({ message }) =>
      listboxMultiDemo.fold(model, message),

    GotListboxGroupedDemoMessage: ({ message }) =>
      listboxGroupedDemo.fold(model, message),

    GotMenuBasicDemoMessage: ({ message }) =>
      menuBasicDemo.fold(model, message),

    GotMenuAnimatedDemoMessage: ({ message }) =>
      menuAnimatedDemo.fold(model, message),

    GotPopoverBasicDemoMessage: ({ message }) =>
      popoverBasicDemo.fold(model, message),

    GotPopoverAnimatedDemoMessage: ({ message }) =>
      popoverAnimatedDemo.fold(model, message),

    GotPopoverArrowDemoMessage: ({ message }) =>
      popoverArrowDemo.fold(model, message),

    GotPopoverNestedParentDemoMessage: ({ message }) =>
      popoverNestedParentDemo.fold(model, message),

    GotPopoverNestedChildDemoMessage: ({ message }) =>
      popoverNestedChildDemo.fold(model, message),

    GotVerticalRadioGroupDemoMessage: ({ message }) =>
      verticalRadioGroupDemo.fold(model, message),

    GotHorizontalRadioGroupDemoMessage: ({ message }) =>
      horizontalRadioGroupDemo.fold(model, message),

    GotSliderRatingDemoMessage: ({ message }) =>
      sliderRatingDemo.fold(model, message),

    GotSliderVolumeDemoMessage: ({ message }) =>
      sliderVolumeDemo.fold(model, message),

    ToggledSwitchDemo: ({ isChecked }) => ({
      model: modifyFields(model, { isSwitchDemoChecked: () => isChecked }),
    }),

    GotHorizontalTabsDemoMessage: ({ message }) =>
      horizontalTabsDemo.fold(model, message),

    GotVerticalTabsDemoMessage: ({ message }) =>
      verticalTabsDemo.fold(model, message),

    GotTooltipDemoMessage: ({ message }) => tooltipDemo.fold(model, message),

    GotHoverIntentCardDemoMessage: ({ message }) =>
      hoverIntentCardDemo.fold(model, message),

    GotHoverIntentMenuDemoMessage: ({ message }) =>
      hoverIntentMenuDemo.fold(model, message),

    ClickedHoverIntentMenuItem: () => hoverIntentMenuDemo.close()(model),

    GotToastDemoMessage: ({ message }) => toastDemo.fold(model, message),

    ClickedShowInfoToast: () =>
      toastDemo.show({
        variant: 'Info',
        payload: {
          title: 'Preferences updated',
          maybeDescription: Option.some('Your changes are saved.'),
        },
      })(model),

    ClickedShowSuccessToast: () =>
      toastDemo.show({
        variant: 'Success',
        payload: {
          title: 'Uploaded',
          maybeDescription: Option.some('kit-manual.pdf is now available.'),
        },
      })(model),

    ClickedShowErrorToast: () =>
      toastDemo.show({
        variant: 'Error',
        payload: {
          title: 'Save failed',
          maybeDescription: Option.some('Check your connection and try again.'),
        },
      })(model),

    ClickedShowStickyToast: () =>
      toastDemo.show({
        variant: 'Info',
        payload: {
          title: 'Action required',
          maybeDescription: Option.some('Stays visible until dismissed.'),
        },
        sticky: true,
      })(model),

    ClickedDismissAllToasts: () => toastDemo.dismissAll()(model),

    GotAnimationDemoMessage: ({ message }) =>
      animationDemo.fold(model, message),

    ClickedToggleAnimationDemo: () =>
      model.animationDemo.isShowing
        ? animationDemo.hide()(model)
        : animationDemo.show()(model),

    GotFileDropBasicDemoMessage: ({ message }) =>
      fileDropBasicDemo.fold(model, message),

    ClickedRemoveFileDropDemoFile: ({ fileIndex }) => ({
      model: modifyFields(model, {
        fileDropBasicDemoFiles: () =>
          Array.remove(model.fileDropBasicDemoFiles, fileIndex),
      }),
    }),

    GotDragAndDropDemoMessage: ({ message }) =>
      dragAndDropDemo.fold(model, message),

    GotVirtualListDemoMessage: ({ message }) =>
      virtualListDemo.fold(model, message),

    ClickedVirtualListScrollToMiddle: () =>
      virtualListDemo.scrollToIndex(Math.floor(VIRTUAL_LIST_ROW_COUNT / 2))(
        model,
      ),

    GotVirtualListVariableDemoMessage: ({ message }) =>
      virtualListVariableDemo.fold(model, message),

    ClickedVirtualListVariableScrollToMiddle: () =>
      virtualListVariableDemo.scrollToIndex(
        Math.floor(VIRTUAL_LIST_ROW_COUNT / 2),
      )(model),

    GotVirtualListChatDemoMessage: ({ message }) =>
      Match.value(message).pipe(
        Match.tag('ObservedContainerScroll', ({ scrollTop }) =>
          Update.combine(model, [
            stepModel => virtualListChatDemo.fold(stepModel, message),
            prependVirtualListChatMessagesOnStartThresholdEntry(scrollTop),
          ]),
        ),
        Match.orElse(() => virtualListChatDemo.fold(model, message)),
      ),

    ClickedVirtualListChatPrepend: () => prependVirtualListChatMessages(model),

    ClickedVirtualListChatScrollToMessage: () =>
      virtualListChatDemo.scrollToKey('7', { alignment: 'Center' })(model),

    ClickedVirtualListChatAppend: () => {
      const nextId = model.virtualListChatNextId
      const nextMessages = Array.append(model.virtualListChatMessages, {
        id: nextId,
        body: `New message ${nextId} arrived at the end.`,
        isExpanded: nextId % 3 === 0,
      })
      return updateVirtualListChatMessages(model, nextMessages, nextId + 1)
    },

    ClickedVirtualListChatToggleMessage: ({ messageId }) => {
      const nextMessages = Array.map(model.virtualListChatMessages, message =>
        message.id === messageId
          ? modifyFields(message, {
              isExpanded: isExpanded => !isExpanded,
            })
          : message,
      )
      return updateVirtualListChatMessages(model, nextMessages)
    },
  }),
)
