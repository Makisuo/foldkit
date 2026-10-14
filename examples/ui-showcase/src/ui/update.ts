import { Array, Number, Option, pipe } from 'effect'
import { Block, Update } from 'foldkit'
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
} from '@foldkit/ui'
import { defaultLeaveCommand } from '@foldkit/ui/animation'

import { CityCombobox, CityMultiCombobox } from './combobox'
import { init } from './init'
import { CharacterListbox, ItemListbox, ItemMultiListbox } from './listbox'
import { DemoMenu } from './menu'
import { Message } from './message'
import { type DemoColumn, Model } from './model'
import { PlanRadioGroup } from './radioGroup'
import { DemoTabs } from './tabs'
import { Toast } from './toast'
import {
  ActivityVirtualList,
  ROW_COUNT as VIRTUAL_LIST_ROW_COUNT,
} from './virtualList'

const UiDefinition = Block.define('Ui', {
  Model: Model,
  Message: Message,
})

const reorderColumns = (
  columns: ReadonlyArray<DemoColumn>,
  itemId: string,
  fromContainerId: string,
  toContainerId: string,
  toIndex: number,
): ReadonlyArray<DemoColumn> => {
  const maybeCard = pipe(
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

        const inserted = [
          ...Array.take(withRemoved, toIndex),
          card,
          ...Array.drop(withRemoved, toIndex),
        ]

        return modifyFields(column, { cards: () => inserted })
      }),
  })
}

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

const foldToastOutMessage = Toast.OutMessage.match<Update.Step<Model, Message>>(
  {
    DismissedToast: () => model => ({ model }),
  },
)

const foldTooltipOutMessage = Tooltip.OutMessage.match<
  Update.Step<Model, Message>
>({
  Shown: () => model => ({ model }),
  Hidden: () => model => ({ model }),
})

const foldHoverIntentOutMessage = HoverIntent.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

export const mobileMenuDialog = Dialog.block.connection({
  Model: Model,
  field: 'mobileMenuDialog',
  parentMessage: Message.GotMobileMenuDialogMessage,
  outMessage: { fold: foldDialogOutMessage },
})

const foldComboboxDemoOutMessage = CityCombobox.OutMessage.match<
  Update.Step<Model, Message>
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
  Model: Model,
  field: 'comboboxDemo',
  parentMessage: Message.GotComboboxDemoMessage,
  outMessage: { fold: foldComboboxDemoOutMessage },
})

const foldComboboxNullableDemoOutMessage = CityCombobox.OutMessage.match<
  Update.Step<Model, Message>
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
  Model: Model,
  field: 'comboboxNullableDemo',
  parentMessage: Message.GotComboboxNullableDemoMessage,
  outMessage: { fold: foldComboboxNullableDemoOutMessage },
})

const foldComboboxMultiDemoOutMessage = CityMultiCombobox.OutMessage.match<
  Update.Step<Model, Message>
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
  Model: Model,
  field: 'comboboxMultiDemo',
  parentMessage: Message.GotComboboxMultiDemoMessage,
  outMessage: { fold: foldComboboxMultiDemoOutMessage },
})

const foldComboboxPlacementLockDemoOutMessage = CityCombobox.OutMessage.match<
  Update.Step<Model, Message>
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
  Model: Model,
  field: 'comboboxPlacementLockDemo',
  parentMessage: Message.GotComboboxPlacementLockDemoMessage,
  outMessage: { fold: foldComboboxPlacementLockDemoOutMessage },
})

const foldComboboxSelectOnFocusDemoOutMessage = CityCombobox.OutMessage.match<
  Update.Step<Model, Message>
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
  Model: Model,
  field: 'comboboxSelectOnFocusDemo',
  parentMessage: Message.GotComboboxSelectOnFocusDemoMessage,
  outMessage: { fold: foldComboboxSelectOnFocusDemoOutMessage },
})

export const dialogDemo = Dialog.block.connection({
  Model: Model,
  field: 'dialogDemo',
  parentMessage: Message.GotDialogDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
})

export const dialogAnimatedDemo = Dialog.block.connection({
  Model: Model,
  field: 'dialogAnimatedDemo',
  parentMessage: Message.GotDialogAnimatedDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
})

export const overlayDialogDemo = Dialog.block.connection({
  Model: Model,
  field: 'overlayDialogDemo',
  parentMessage: Message.GotOverlayDialogDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
})

const foldOverlayComboboxDemoOutMessage = CityCombobox.OutMessage.match<
  Update.Step<Model, Message>
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
  Model: Model,
  field: 'overlayComboboxDemo',
  parentMessage: Message.GotOverlayComboboxDemoMessage,
  outMessage: { fold: foldOverlayComboboxDemoOutMessage },
})

export const nestedDialogParentDemo = Dialog.block.connection({
  Model: Model,
  field: 'nestedDialogParentDemo',
  parentMessage: Message.GotNestedDialogParentDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
})

export const nestedDialogChildDemo = Dialog.block.connection({
  Model: Model,
  field: 'nestedDialogChildDemo',
  parentMessage: Message.GotNestedDialogChildDemoMessage,
  outMessage: { fold: foldDialogOutMessage },
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
  Model: Model,
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
  Model: Model,
  field: 'datePickerBasicDemo',
  parentMessage: Message.GotDatePickerBasicDemoMessage,
  outMessage: { fold: foldDatePickerBasicDemoOutMessage },
})

const foldDragAndDropDemoOutMessage = DragAndDrop.OutMessage.match<
  Update.Step<Model, Message>
>({
  Reordered:
    ({ itemId, fromContainerId, toContainerId, toIndex }) =>
    model => ({
      model: modifyFields(model, {
        dragAndDropDemoColumns: dragAndDropDemoColumns =>
          reorderColumns(
            dragAndDropDemoColumns,
            itemId,
            fromContainerId,
            toContainerId,
            toIndex,
          ),
      }),
    }),
  Cancelled: () => model => ({ model }),
})

export const dragAndDropDemo = DragAndDrop.block.connection({
  Model: Model,
  field: 'dragAndDropDemo',
  parentMessage: Message.GotDragAndDropDemoMessage,
  outMessage: { fold: foldDragAndDropDemoOutMessage },
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
  Model: Model,
  field: 'fileDropBasicDemo',
  parentMessage: Message.GotFileDropBasicDemoMessage,
  outMessage: { fold: foldFileDropBasicDemoOutMessage },
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
  Model: Model,
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
  Model: Model,
  field: 'listboxMultiDemo',
  parentMessage: Message.GotListboxMultiDemoMessage,
  outMessage: { fold: foldListboxMultiDemoOutMessage },
})

const foldListboxGroupedDemoOutMessage = CharacterListbox.OutMessage.match<
  Update.Step<Model, Message>
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
  Model: Model,
  field: 'listboxGroupedDemo',
  parentMessage: Message.GotListboxGroupedDemoMessage,
  outMessage: { fold: foldListboxGroupedDemoOutMessage },
})

export const menuBasicDemo = DemoMenu.connection({
  Model: Model,
  field: 'menuBasicDemo',
  parentMessage: Message.GotMenuBasicDemoMessage,
  outMessage: { fold: foldMenuOutMessage },
})

export const menuAnimatedDemo = DemoMenu.connection({
  Model: Model,
  field: 'menuAnimatedDemo',
  parentMessage: Message.GotMenuAnimatedDemoMessage,
  outMessage: { fold: foldMenuOutMessage },
})

export const popoverBasicDemo = Popover.block.connection({
  Model: Model,
  field: 'popoverBasicDemo',
  parentMessage: Message.GotPopoverBasicDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

export const popoverAnimatedDemo = Popover.block.connection({
  Model: Model,
  field: 'popoverAnimatedDemo',
  parentMessage: Message.GotPopoverAnimatedDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

export const popoverNestedParentDemo = Popover.block.connection({
  Model: Model,
  field: 'popoverNestedParentDemo',
  parentMessage: Message.GotPopoverNestedParentDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

export const popoverNestedChildDemo = Popover.block.connection({
  Model: Model,
  field: 'popoverNestedChildDemo',
  parentMessage: Message.GotPopoverNestedChildDemoMessage,
  outMessage: { fold: foldPopoverOutMessage },
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

export const verticalRadioGroupDemo = PlanRadioGroup.connection({
  Model: Model,
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
  Model: Model,
  field: 'horizontalRadioGroupDemo',
  parentMessage: Message.GotHorizontalRadioGroupDemoMessage,
  outMessage: { fold: foldHorizontalRadioGroupDemoOutMessage },
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
  Model: Model,
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
  Model: Model,
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
  Model: Model,
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
  Model: Model,
  field: 'verticalTabsDemo',
  parentMessage: Message.GotVerticalTabsDemoMessage,
  outMessage: { fold: foldVerticalTabsDemoOutMessage },
})

export const toastDemo = Toast.connection({
  Model: Model,
  field: 'toastDemo',
  parentMessage: Message.GotToastDemoMessage,
  outMessage: { fold: foldToastOutMessage },
})

export const tooltipBasicDemo = Tooltip.block.connection({
  Model: Model,
  field: 'tooltipBasicDemo',
  parentMessage: Message.GotTooltipBasicDemoMessage,
  outMessage: { fold: foldTooltipOutMessage },
})

export const tooltipNoDelayDemo = Tooltip.block.connection({
  Model: Model,
  field: 'tooltipNoDelayDemo',
  parentMessage: Message.GotTooltipNoDelayDemoMessage,
  outMessage: { fold: foldTooltipOutMessage },
})

export const hoverIntentDemo = HoverIntent.block.connection({
  Model: Model,
  field: 'hoverIntentDemo',
  parentMessage: Message.GotHoverIntentDemoMessage,
  outMessage: { fold: foldHoverIntentOutMessage },
})

const foldAnimationDemoOutMessage = (
  outMessage: typeof Animation.OutMessage.Type,
  { liftCommand }: Update.FoldContext<typeof Animation.Message.Type, Message>,
) =>
  Animation.OutMessage.match(outMessage, {
    StartedLeaveAnimating: () =>
      UiDefinition.step(model => ({
        model,
        commands: [liftCommand(defaultLeaveCommand(model.animationDemo))],
      })),
    TransitionedOut: () => UiDefinition.step(model => ({ model })),
  })

export const animationDemo = Animation.block.connection({
  Model: Model,
  field: 'animationDemo',
  parentMessage: Message.GotAnimationDemoMessage,
  outMessage: { fold: foldAnimationDemoOutMessage },
})

export const virtualListDemo = ActivityVirtualList.connection({
  Model: Model,
  field: 'virtualListDemo',
  parentMessage: Message.GotVirtualListDemoMessage,
})

export const virtualListVariableDemo = ActivityVirtualList.connection({
  Model: Model,
  field: 'virtualListVariableDemo',
  parentMessage: Message.GotVirtualListVariableDemoMessage,
})

export const RegisteredUiDefinition = UiDefinition.register({
  children: [
    mobileMenuDialog,
    comboboxDemo,
    comboboxNullableDemo,
    comboboxMultiDemo,
    comboboxPlacementLockDemo,
    comboboxSelectOnFocusDemo,
    dialogDemo,
    dialogAnimatedDemo,
    overlayDialogDemo,
    overlayComboboxDemo,
    nestedDialogParentDemo,
    nestedDialogChildDemo,
    calendarBasicDemo,
    datePickerBasicDemo,
    dragAndDropDemo,
    fileDropBasicDemo,
    listboxDemo,
    listboxMultiDemo,
    listboxGroupedDemo,
    menuBasicDemo,
    menuAnimatedDemo,
    popoverBasicDemo,
    popoverAnimatedDemo,
    popoverNestedParentDemo,
    popoverNestedChildDemo,
    verticalRadioGroupDemo,
    horizontalRadioGroupDemo,
    sliderRatingDemo,
    sliderVolumeDemo,
    horizontalTabsDemo,
    verticalTabsDemo,
    toastDemo,
    tooltipBasicDemo,
    tooltipNoDelayDemo,
    hoverIntentDemo,
    animationDemo,
    virtualListDemo,
    virtualListVariableDemo,
  ],
})

export const update = UiDefinition.update((model, message) =>
  Message.match(message, {
    GotMobileMenuDialogMessage: ({ message }) =>
      mobileMenuDialog.fold(model, message),

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

    GotComboboxNullableDemoMessage: ({ message }) =>
      comboboxNullableDemo.fold(model, message),

    GotComboboxMultiDemoMessage: ({ message }) =>
      comboboxMultiDemo.fold(model, message),

    GotComboboxPlacementLockDemoMessage: ({ message }) =>
      comboboxPlacementLockDemo.fold(model, message),

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

    ToggledDisclosureBasicDemo: ({ isOpen }) => ({
      model: modifyFields(model, {
        isDisclosureBasicDemoOpen: () => isOpen,
      }),
    }),

    ToggledDisclosureAnimatedDemo: ({ isOpen }) => ({
      model: modifyFields(model, {
        isDisclosureAnimatedDemoOpen: () => isOpen,
      }),
    }),

    ToggledDisclosureCollapsedPreviewDemo: ({ isOpen }) => ({
      model: modifyFields(model, {
        isDisclosureCollapsedPreviewDemoOpen: () => isOpen,
      }),
    }),

    GotCalendarBasicDemoMessage: ({ message }) =>
      calendarBasicDemo.fold(model, message),

    GotDatePickerBasicDemoMessage: ({ message }) =>
      datePickerBasicDemo.fold(model, message),

    GotDragAndDropDemoMessage: ({ message }) =>
      dragAndDropDemo.fold(model, message),

    GotFileDropBasicDemoMessage: ({ message }) =>
      fileDropBasicDemo.fold(model, message),

    ClickedRemoveFileDropDemoFile: ({ fileIndex }) => ({
      model: modifyFields(model, {
        fileDropBasicDemoFiles: () =>
          Array.remove(model.fileDropBasicDemoFiles, fileIndex),
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
      model: modifyFields(model, {
        isSwitchDemoChecked: () => isChecked,
      }),
    }),

    GotHorizontalTabsDemoMessage: ({ message }) =>
      horizontalTabsDemo.fold(model, message),

    GotVerticalTabsDemoMessage: ({ message }) =>
      verticalTabsDemo.fold(model, message),

    GotToastDemoMessage: ({ message }) => toastDemo.fold(model, message),

    ClickedShowInfoToast: () =>
      toastDemo.show({
        variant: 'Info',
        payload: {
          title: 'Changes saved',
          maybeDescription: Option.some('Your preferences have been updated.'),
        },
      })(model),

    ClickedShowSuccessToast: () =>
      toastDemo.show({
        variant: 'Success',
        payload: {
          title: 'Uploaded successfully',
          maybeDescription: Option.some('kit-manual.pdf is now available.'),
        },
      })(model),

    ClickedShowWarningToast: () =>
      toastDemo.show({
        variant: 'Warning',
        payload: {
          title: 'Network slow',
          maybeDescription: Option.some(
            'Some assets are loading over a weak connection.',
          ),
        },
      })(model),

    ClickedShowErrorToast: () =>
      toastDemo.show({
        variant: 'Error',
        payload: {
          title: 'Failed to save',
          maybeDescription: Option.some('Check your connection and try again.'),
        },
      })(model),

    ClickedShowStickyToast: () =>
      toastDemo.show({
        variant: 'Info',
        payload: {
          title: 'Review pending',
          maybeDescription: Option.some(
            'Action required. This stays until dismissed.',
          ),
        },
        sticky: true,
      })(model),

    ClickedDismissAllToasts: () => toastDemo.dismissAll()(model),

    GotTooltipBasicDemoMessage: ({ message }) =>
      tooltipBasicDemo.fold(model, message),

    GotTooltipNoDelayDemoMessage: ({ message }) =>
      tooltipNoDelayDemo.fold(model, message),

    GotHoverIntentDemoMessage: ({ message }) =>
      hoverIntentDemo.fold(model, message),

    GotAnimationDemoMessage: ({ message }) =>
      animationDemo.fold(model, message),

    ToggledAnimationDemo: () =>
      model.animationDemo.isShowing
        ? animationDemo.hide()(model)
        : animationDemo.show()(model),

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
  }),
)

export const openMobileMenu = UiDefinition.step(mobileMenuDialog.open())

export const closeMobileMenu = UiDefinition.step(mobileMenuDialog.close())

export const block = RegisteredUiDefinition.toBlock({
  init,
  update,
  expose: { openMobileMenu, closeMobileMenu },
})
