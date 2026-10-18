import { Array, Option } from 'effect'
import { type Block, Calendar as FoldkitCalendar, Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  Calendar,
  DatePicker,
  Dialog,
  FileDrop,
  HoverIntent,
  Popover,
  Slider,
  Tooltip,
  VirtualList,
} from '@foldkit/ui'

import { CityCombobox, CityMultiCombobox } from '../combobox'
import { UiDefinition } from '../definition'
import { CharacterListbox, ItemListbox, ItemMultiListbox } from '../listbox'
import { DemoMenu } from '../menu'
import { Message } from '../message'
import { Model } from '../model'
import { PlanRadioGroup } from '../radioGroup'
import { DemoTabs } from '../tabs'
import { Toast } from '../toast'
import { ActivityVirtualList } from '../virtualList'
import { AnimationDemoBinding } from './animation'
import { DragAndDropDemoBinding } from './dragAndDrop'

const foldDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
  CompletedClose: () => model => ({ model }),
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

export const MobileMenuDialogBinding = UiDefinition.bindChild(Dialog.block, {
  field: 'mobileMenuDialog',
  parentMessage: Message.GotMobileMenuDialogMessage,
  init: { startupToArgs: () => [{ id: 'mobile-menu' }] },
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

export const ComboboxDemoBinding = UiDefinition.bindChild(CityCombobox, {
  field: 'comboboxDemo',
  parentMessage: Message.GotComboboxDemoMessage,
  init: { startupToArgs: () => [{ id: 'combobox-demo' }] },
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

export const ComboboxNullableDemoBinding = UiDefinition.bindChild(
  CityCombobox,
  {
    field: 'comboboxNullableDemo',
    parentMessage: Message.GotComboboxNullableDemoMessage,
    init: {
      startupToArgs: () => [{ id: 'combobox-nullable-demo', nullable: true }],
    },
    outMessage: { fold: foldComboboxNullableDemoOutMessage },
  },
)

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

export const ComboboxMultiDemoBinding = UiDefinition.bindChild(
  CityMultiCombobox,
  {
    field: 'comboboxMultiDemo',
    parentMessage: Message.GotComboboxMultiDemoMessage,
    init: { startupToArgs: () => [{ id: 'combobox-multi-demo' }] },
    outMessage: { fold: foldComboboxMultiDemoOutMessage },
  },
)

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

export const ComboboxPlacementLockDemoBinding = UiDefinition.bindChild(
  CityCombobox,
  {
    field: 'comboboxPlacementLockDemo',
    parentMessage: Message.GotComboboxPlacementLockDemoMessage,
    init: { startupToArgs: () => [{ id: 'combobox-placement-lock-demo' }] },
    outMessage: { fold: foldComboboxPlacementLockDemoOutMessage },
  },
)

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

export const ComboboxSelectOnFocusDemoBinding = UiDefinition.bindChild(
  CityCombobox,
  {
    field: 'comboboxSelectOnFocusDemo',
    parentMessage: Message.GotComboboxSelectOnFocusDemoMessage,
    init: {
      startupToArgs: () => [
        { id: 'combobox-select-on-focus-demo', selectInputOnFocus: true },
      ],
    },
    outMessage: { fold: foldComboboxSelectOnFocusDemoOutMessage },
  },
)

export const DialogDemoBinding = UiDefinition.bindChild(Dialog.block, {
  field: 'dialogDemo',
  parentMessage: Message.GotDialogDemoMessage,
  init: { startupToArgs: () => [{ id: 'dialog-demo' }] },
  outMessage: { fold: foldDialogOutMessage },
})

export const DialogAnimatedDemoBinding = UiDefinition.bindChild(Dialog.block, {
  field: 'dialogAnimatedDemo',
  parentMessage: Message.GotDialogAnimatedDemoMessage,
  init: {
    startupToArgs: () => [{ id: 'dialog-animated-demo', isAnimated: true }],
  },
  outMessage: { fold: foldDialogOutMessage },
})

export const OverlayDialogDemoBinding = UiDefinition.bindChild(Dialog.block, {
  field: 'overlayDialogDemo',
  parentMessage: Message.GotOverlayDialogDemoMessage,
  init: { startupToArgs: () => [{ id: 'overlay-dialog-demo' }] },
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

export const OverlayComboboxDemoBinding = UiDefinition.bindChild(CityCombobox, {
  field: 'overlayComboboxDemo',
  parentMessage: Message.GotOverlayComboboxDemoMessage,
  init: { startupToArgs: () => [{ id: 'overlay-combobox-demo' }] },
  outMessage: { fold: foldOverlayComboboxDemoOutMessage },
})

export const NestedDialogParentDemoBinding = UiDefinition.bindChild(
  Dialog.block,
  {
    field: 'nestedDialogParentDemo',
    parentMessage: Message.GotNestedDialogParentDemoMessage,
    init: { startupToArgs: () => [{ id: 'nested-dialog-parent-demo' }] },
    outMessage: { fold: foldDialogOutMessage },
  },
)

export const NestedDialogChildDemoBinding = UiDefinition.bindChild(
  Dialog.block,
  {
    field: 'nestedDialogChildDemo',
    parentMessage: Message.GotNestedDialogChildDemoMessage,
    init: { startupToArgs: () => [{ id: 'nested-dialog-child-demo' }] },
    outMessage: { fold: foldDialogOutMessage },
  },
)

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

export const CalendarBasicDemoBinding = UiDefinition.bindChild(Calendar.block, {
  field: 'calendarBasicDemo',
  parentMessage: Message.GotCalendarBasicDemoMessage,
  init: {
    startupToArgs: today => [
      {
        id: 'calendar-basic-demo',
        today,
        minDate: FoldkitCalendar.subtractYears(today, 1),
        maxDate: FoldkitCalendar.addYears(today, 1),
      },
    ],
  },
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

export const DatePickerBasicDemoBinding = UiDefinition.bindChild(
  DatePicker.block,
  {
    field: 'datePickerBasicDemo',
    parentMessage: Message.GotDatePickerBasicDemoMessage,
    init: {
      startupToArgs: today => [
        {
          id: 'date-picker-basic-demo',
          today,
          minDate: FoldkitCalendar.subtractYears(today, 1),
          maxDate: FoldkitCalendar.addYears(today, 1),
        },
      ],
    },
    outMessage: { fold: foldDatePickerBasicDemoOutMessage },
  },
)

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

export const FileDropBasicDemoBinding = UiDefinition.bindChild(FileDrop.block, {
  field: 'fileDropBasicDemo',
  parentMessage: Message.GotFileDropBasicDemoMessage,
  init: { startupToArgs: () => [{ id: 'file-drop-basic-demo' }] },
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

export const ListboxDemoBinding = UiDefinition.bindChild(ItemListbox, {
  field: 'listboxDemo',
  parentMessage: Message.GotListboxDemoMessage,
  init: { startupToArgs: () => [{ id: 'listbox-demo' }] },
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

export const ListboxMultiDemoBinding = UiDefinition.bindChild(
  ItemMultiListbox,
  {
    field: 'listboxMultiDemo',
    parentMessage: Message.GotListboxMultiDemoMessage,
    init: { startupToArgs: () => [{ id: 'listbox-multi-demo' }] },
    outMessage: { fold: foldListboxMultiDemoOutMessage },
  },
)

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

export const ListboxGroupedDemoBinding = UiDefinition.bindChild(
  CharacterListbox,
  {
    field: 'listboxGroupedDemo',
    parentMessage: Message.GotListboxGroupedDemoMessage,
    init: { startupToArgs: () => [{ id: 'listbox-grouped-demo' }] },
    outMessage: { fold: foldListboxGroupedDemoOutMessage },
  },
)

export const MenuBasicDemoBinding = UiDefinition.bindChild(DemoMenu, {
  field: 'menuBasicDemo',
  parentMessage: Message.GotMenuBasicDemoMessage,
  init: { startupToArgs: () => [{ id: 'menu-basic-demo' }] },
  outMessage: { fold: foldMenuOutMessage },
})

export const MenuAnimatedDemoBinding = UiDefinition.bindChild(DemoMenu, {
  field: 'menuAnimatedDemo',
  parentMessage: Message.GotMenuAnimatedDemoMessage,
  init: {
    startupToArgs: () => [{ id: 'menu-animated-demo', isAnimated: true }],
  },
  outMessage: { fold: foldMenuOutMessage },
})

export const PopoverBasicDemoBinding = UiDefinition.bindChild(Popover.block, {
  field: 'popoverBasicDemo',
  parentMessage: Message.GotPopoverBasicDemoMessage,
  init: { startupToArgs: () => [{ id: 'popover-basic-demo' }] },
  outMessage: { fold: foldPopoverOutMessage },
})

export const PopoverAnimatedDemoBinding = UiDefinition.bindChild(
  Popover.block,
  {
    field: 'popoverAnimatedDemo',
    parentMessage: Message.GotPopoverAnimatedDemoMessage,
    init: {
      startupToArgs: () => [{ id: 'popover-animated-demo', isAnimated: true }],
    },
    outMessage: { fold: foldPopoverOutMessage },
  },
)

export const PopoverNestedParentDemoBinding = UiDefinition.bindChild(
  Popover.block,
  {
    field: 'popoverNestedParentDemo',
    parentMessage: Message.GotPopoverNestedParentDemoMessage,
    init: {
      startupToArgs: () => [
        { id: 'popover-nested-parent-demo', contentFocus: true },
      ],
    },
    outMessage: { fold: foldPopoverOutMessage },
  },
)

export const PopoverNestedChildDemoBinding = UiDefinition.bindChild(
  Popover.block,
  {
    field: 'popoverNestedChildDemo',
    parentMessage: Message.GotPopoverNestedChildDemoMessage,
    init: { startupToArgs: () => [{ id: 'popover-nested-child-demo' }] },
    outMessage: { fold: foldPopoverOutMessage },
  },
)

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

export const VerticalRadioGroupDemoBinding = UiDefinition.bindChild(
  PlanRadioGroup,
  {
    field: 'verticalRadioGroupDemo',
    parentMessage: Message.GotVerticalRadioGroupDemoMessage,
    init: { startupToArgs: () => [{ id: 'vertical-radio-group-demo' }] },
    outMessage: { fold: foldVerticalRadioGroupDemoOutMessage },
  },
)

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

export const HorizontalRadioGroupDemoBinding = UiDefinition.bindChild(
  PlanRadioGroup,
  {
    field: 'horizontalRadioGroupDemo',
    parentMessage: Message.GotHorizontalRadioGroupDemoMessage,
    init: { startupToArgs: () => [{ id: 'horizontal-radio-group-demo' }] },
    outMessage: { fold: foldHorizontalRadioGroupDemoOutMessage },
  },
)

const foldSliderRatingDemoOutMessage = Slider.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedValue:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { sliderRatingValue: () => value }),
    }),
})

export const SliderRatingDemoBinding = UiDefinition.bindChild(Slider.block, {
  field: 'sliderRatingDemo',
  parentMessage: Message.GotSliderRatingDemoMessage,
  init: {
    startupToArgs: () => [
      { id: 'slider-rating-demo', min: 0, max: 10, step: 1 },
    ],
  },
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

export const SliderVolumeDemoBinding = UiDefinition.bindChild(Slider.block, {
  field: 'sliderVolumeDemo',
  parentMessage: Message.GotSliderVolumeDemoMessage,
  init: {
    startupToArgs: () => [
      { id: 'slider-volume-demo', min: 0, max: 1, step: 0.05 },
    ],
  },
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

export const HorizontalTabsDemoBinding = UiDefinition.bindChild(DemoTabs, {
  field: 'horizontalTabsDemo',
  parentMessage: Message.GotHorizontalTabsDemoMessage,
  init: { startupToArgs: () => [{ id: 'horizontal-tabs-demo' }] },
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

export const VerticalTabsDemoBinding = UiDefinition.bindChild(DemoTabs, {
  field: 'verticalTabsDemo',
  parentMessage: Message.GotVerticalTabsDemoMessage,
  init: { startupToArgs: () => [{ id: 'vertical-tabs-demo' }] },
  outMessage: { fold: foldVerticalTabsDemoOutMessage },
})

export const ToastDemoBinding = UiDefinition.bindChild(Toast, {
  field: 'toastDemo',
  parentMessage: Message.GotToastDemoMessage,
  init: { startupToArgs: () => [{ id: 'toast-demo', swipeToDismiss: {} }] },
  outMessage: { fold: foldToastOutMessage },
})

export const TooltipBasicDemoBinding = UiDefinition.bindChild(Tooltip.block, {
  field: 'tooltipBasicDemo',
  parentMessage: Message.GotTooltipBasicDemoMessage,
  init: { startupToArgs: () => [{ id: 'tooltip-basic-demo' }] },
  outMessage: { fold: foldTooltipOutMessage },
})

export const TooltipNoDelayDemoBinding = UiDefinition.bindChild(Tooltip.block, {
  field: 'tooltipNoDelayDemo',
  parentMessage: Message.GotTooltipNoDelayDemoMessage,
  init: {
    startupToArgs: () => [{ id: 'tooltip-no-delay-demo', showDelay: 0 }],
  },
  outMessage: { fold: foldTooltipOutMessage },
})

export const HoverIntentDemoBinding = UiDefinition.bindChild(
  HoverIntent.block,
  {
    field: 'hoverIntentDemo',
    parentMessage: Message.GotHoverIntentDemoMessage,
    outMessage: { fold: foldHoverIntentOutMessage },
  },
)

const foldVirtualListOutMessage = VirtualList.OutMessage.match<
  Update.Step<Model, Message>
>({
  ObservedContainerScroll: () => model => ({ model }),
})

export const VirtualListDemoBinding = UiDefinition.bindChild(
  ActivityVirtualList,
  {
    field: 'virtualListDemo',
    parentMessage: Message.GotVirtualListDemoMessage,
    outMessage: { fold: foldVirtualListOutMessage },
    init: {
      startupToArgs: () => [{ id: 'virtual-list-demo', rowHeightPx: 56 }],
    },
  },
)

export const VirtualListVariableDemoBinding = UiDefinition.bindChild(
  ActivityVirtualList,
  {
    field: 'virtualListVariableDemo',
    parentMessage: Message.GotVirtualListVariableDemoMessage,
    outMessage: { fold: foldVirtualListOutMessage },
    init: {
      startupToArgs: () => [
        { id: 'virtual-list-variable-demo', rowHeightPx: 56 },
      ],
    },
  },
)

export const UiComposition = UiDefinition.makeComposition({
  childBindings: [
    MobileMenuDialogBinding,
    ComboboxDemoBinding,
    ComboboxNullableDemoBinding,
    ComboboxMultiDemoBinding,
    ComboboxPlacementLockDemoBinding,
    ComboboxSelectOnFocusDemoBinding,
    DialogDemoBinding,
    DialogAnimatedDemoBinding,
    OverlayDialogDemoBinding,
    OverlayComboboxDemoBinding,
    NestedDialogParentDemoBinding,
    NestedDialogChildDemoBinding,
    CalendarBasicDemoBinding,
    DatePickerBasicDemoBinding,
    DragAndDropDemoBinding,
    FileDropBasicDemoBinding,
    ListboxDemoBinding,
    ListboxMultiDemoBinding,
    ListboxGroupedDemoBinding,
    MenuBasicDemoBinding,
    MenuAnimatedDemoBinding,
    PopoverBasicDemoBinding,
    PopoverAnimatedDemoBinding,
    PopoverNestedParentDemoBinding,
    PopoverNestedChildDemoBinding,
    VerticalRadioGroupDemoBinding,
    HorizontalRadioGroupDemoBinding,
    SliderRatingDemoBinding,
    SliderVolumeDemoBinding,
    HorizontalTabsDemoBinding,
    VerticalTabsDemoBinding,
    ToastDemoBinding,
    TooltipBasicDemoBinding,
    TooltipNoDelayDemoBinding,
    HoverIntentDemoBinding,
    AnimationDemoBinding,
    VirtualListDemoBinding,
    VirtualListVariableDemoBinding,
  ],
})
export type UiViewBuilder = Block.ViewBuilderFor<typeof UiComposition>
