import { Array, Option, Schema, pipe } from 'effect'
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
import { Ui } from './definition'
import {
  CharacterListbox,
  DemoMenu,
  DemoTabs,
  ItemListbox,
  ItemMultiListbox,
  PlanRadioGroup,
} from './demo/components'
import { Toast } from './demo/toastModule'
import { type Activity } from './demo/virtualListData'
import { Message } from './message'
import {
  type DemoCard,
  type DemoColumn,
  Model,
  type VirtualListChatMessage,
} from './model'

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

export const calendarBasicDemo = Ui.bindChild(Calendar.block, {
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

export const datePickerBasicDemo = Ui.bindChild(DatePicker.block, {
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

export const comboboxDemo = Ui.bindChild(CityCombobox, {
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

export const comboboxPlacementLockDemo = Ui.bindChild(CityCombobox, {
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

export const comboboxNullableDemo = Ui.bindChild(CityCombobox, {
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

export const comboboxMultiDemo = Ui.bindChild(CityMultiCombobox, {
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

export const comboboxSelectOnFocusDemo = Ui.bindChild(CityCombobox, {
  field: 'comboboxSelectOnFocusDemo',
  parentMessage: Message.GotComboboxSelectOnFocusDemoMessage,
  outMessage: { fold: foldComboboxSelectOnFocusDemoOutMessage },
})

export const dialogDemo = Ui.bindChild(Dialog.block, {
  field: 'dialogDemo',
  parentMessage: Message.GotDialogDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
})

export const dialogAnimatedDemo = Ui.bindChild(Dialog.block, {
  field: 'dialogAnimatedDemo',
  parentMessage: Message.GotDialogAnimatedDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
})

export const overlayDialogDemo = Ui.bindChild(Dialog.block, {
  field: 'overlayDialogDemo',
  parentMessage: Message.GotOverlayDialogDemoMessage,
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

export const overlayComboboxDemo = Ui.bindChild(CityCombobox, {
  field: 'overlayComboboxDemo',
  parentMessage: Message.GotOverlayComboboxDemoMessage,
  outMessage: { fold: foldOverlayComboboxDemoOutMessage },
})

export const nestedDialogParentDemo = Ui.bindChild(Dialog.block, {
  field: 'nestedDialogParentDemo',
  parentMessage: Message.GotNestedDialogParentDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
})

export const nestedDialogChildDemo = Ui.bindChild(Dialog.block, {
  field: 'nestedDialogChildDemo',
  parentMessage: Message.GotNestedDialogChildDemoMessage,
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

export const listboxDemo = Ui.bindChild(ItemListbox, {
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

export const listboxMultiDemo = Ui.bindChild(ItemMultiListbox, {
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

export const listboxGroupedDemo = Ui.bindChild(CharacterListbox, {
  field: 'listboxGroupedDemo',
  parentMessage: Message.GotListboxGroupedDemoMessage,
  outMessage: { fold: foldListboxGroupedDemoOutMessage },
})

export const menuBasicDemo = Ui.bindChild(DemoMenu, {
  field: 'menuBasicDemo',
  parentMessage: Message.GotMenuBasicDemoMessage,
  outMessage: { fold: foldMenuOutMessage },
})

export const menuAnimatedDemo = Ui.bindChild(DemoMenu, {
  field: 'menuAnimatedDemo',
  parentMessage: Message.GotMenuAnimatedDemoMessage,
  outMessage: { fold: foldMenuOutMessage },
})

export const popoverBasicDemo = Ui.bindChild(Popover.block, {
  field: 'popoverBasicDemo',
  parentMessage: Message.GotPopoverBasicDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

export const popoverAnimatedDemo = Ui.bindChild(Popover.block, {
  field: 'popoverAnimatedDemo',
  parentMessage: Message.GotPopoverAnimatedDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

export const popoverArrowDemo = Ui.bindChild(Popover.block, {
  field: 'popoverArrowDemo',
  parentMessage: Message.GotPopoverArrowDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

export const popoverNestedParentDemo = Ui.bindChild(Popover.block, {
  field: 'popoverNestedParentDemo',
  parentMessage: Message.GotPopoverNestedParentDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

export const popoverNestedChildDemo = Ui.bindChild(Popover.block, {
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

export const sliderRatingDemo = Ui.bindChild(Slider.block, {
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

export const sliderVolumeDemo = Ui.bindChild(Slider.block, {
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

export const horizontalTabsDemo = Ui.bindChild(DemoTabs, {
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

export const verticalTabsDemo = Ui.bindChild(DemoTabs, {
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

export const tooltipDemo = Ui.bindChild(Tooltip.block, {
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

export const hoverIntentCardDemo = Ui.bindChild(HoverIntent.block, {
  field: 'hoverIntentCardDemo',
  parentMessage: Message.GotHoverIntentCardDemoMessage,
  outMessage: { fold: foldHoverIntentOutMessage },
})

export const hoverIntentMenuDemo = Ui.bindChild(HoverIntent.block, {
  field: 'hoverIntentMenuDemo',
  parentMessage: Message.GotHoverIntentMenuDemoMessage,
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

export const toastDemo = Ui.bindChild(Toast, {
  field: 'toastDemo',
  parentMessage: Message.GotToastDemoMessage,
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

export const animationDemo = Ui.bindChild(Animation.block, {
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

export const fileDropBasicDemo = Ui.bindChild(FileDrop.block, {
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

export const dragAndDropDemo = Ui.bindChild(DragAndDrop.block, {
  read: model => Option.some(model.dragAndDropDemo),
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

export const virtualListDemo = Ui.bindChild(ActivityVirtualList, {
  field: 'virtualListDemo',
  parentMessage: Message.GotVirtualListDemoMessage,
})

export const virtualListVariableDemo = Ui.bindChild(ActivityVirtualList, {
  field: 'virtualListVariableDemo',
  parentMessage: Message.GotVirtualListVariableDemoMessage,
})

export const virtualListChatDemo = Ui.bindChild(ChatVirtualList, {
  field: 'virtualListChatDemo',
  parentMessage: Message.GotVirtualListChatDemoMessage,
})

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

export const verticalRadioGroupDemo = Ui.bindChild(PlanRadioGroup, {
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

export const horizontalRadioGroupDemo = Ui.bindChild(PlanRadioGroup, {
  field: 'horizontalRadioGroupDemo',
  parentMessage: Message.GotHorizontalRadioGroupDemoMessage,
  outMessage: { fold: foldHorizontalRadioGroupDemoOutMessage },
})

export const UiComposition = Ui.toComposition({
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
export type UiViewBuilder = Block.ViewBuilderFor<typeof UiComposition>
