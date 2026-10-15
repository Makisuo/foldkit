import { Array, Option } from 'effect'
import { type Block, Update } from 'foldkit'
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
} from '@foldkit/ui'

import { CityCombobox, CityMultiCombobox } from '../combobox'
import { Ui } from '../definition'
import { CharacterListbox, ItemListbox, ItemMultiListbox } from '../listbox'
import { DemoMenu } from '../menu'
import { Message } from '../message'
import { Model } from '../model'
import { PlanRadioGroup } from '../radioGroup'
import { DemoTabs } from '../tabs'
import { Toast } from '../toast'
import { ActivityVirtualList } from '../virtualList'
import { animationDemo } from './animation'
import { dragAndDropDemo } from './dragAndDrop'

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

export const mobileMenuDialog = Ui.bindChild(Dialog.block, {
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

export const comboboxDemo = Ui.bindChild(CityCombobox, {
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

export const comboboxNullableDemo = Ui.bindChild(CityCombobox, {
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

export const comboboxMultiDemo = Ui.bindChild(CityMultiCombobox, {
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

export const comboboxPlacementLockDemo = Ui.bindChild(CityCombobox, {
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

export const toastDemo = Ui.bindChild(Toast, {
  field: 'toastDemo',
  parentMessage: Message.GotToastDemoMessage,
  outMessage: { fold: foldToastOutMessage },
})

export const tooltipBasicDemo = Ui.bindChild(Tooltip.block, {
  field: 'tooltipBasicDemo',
  parentMessage: Message.GotTooltipBasicDemoMessage,
  outMessage: { fold: foldTooltipOutMessage },
})

export const tooltipNoDelayDemo = Ui.bindChild(Tooltip.block, {
  field: 'tooltipNoDelayDemo',
  parentMessage: Message.GotTooltipNoDelayDemoMessage,
  outMessage: { fold: foldTooltipOutMessage },
})

export const hoverIntentDemo = Ui.bindChild(HoverIntent.block, {
  field: 'hoverIntentDemo',
  parentMessage: Message.GotHoverIntentDemoMessage,
  outMessage: { fold: foldHoverIntentOutMessage },
})

export const virtualListDemo = Ui.bindChild(ActivityVirtualList, {
  field: 'virtualListDemo',
  parentMessage: Message.GotVirtualListDemoMessage,
})

export const virtualListVariableDemo = Ui.bindChild(ActivityVirtualList, {
  field: 'virtualListVariableDemo',
  parentMessage: Message.GotVirtualListVariableDemoMessage,
})

export const children = [
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
] as const

export const UiComposition = Ui.toComposition({ children })

export type ViewBuilder = Block.HtmlBuilderOf<typeof UiComposition>
