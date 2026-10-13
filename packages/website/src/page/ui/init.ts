import { Array, Option } from 'effect'
import { Calendar, Update } from 'foldkit'

import { ScrollTarget } from '@foldkit/ui/virtualList'

import type { Message } from './message'
import {
  type Model,
  type VirtualListChatMessage,
  VirtualListChatStartProximity,
} from './model'
import {
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
} from './update'

export type InitReturn = Update.Return<Model, Message>

const chatBodies = [
  'Can you review the latest build?',
  'Yep — the navigation fix looks good.',
  'I also checked the keyboard flow and the focus order is stable.',
  'Perfect. I’ll queue the release once CI finishes.',
]

const INITIAL_VIRTUAL_LIST_CHAT_MESSAGE_COUNT = 24

const initialVirtualListChatMessages: ReadonlyArray<VirtualListChatMessage> =
  Array.makeBy(INITIAL_VIRTUAL_LIST_CHAT_MESSAGE_COUNT, index => ({
    id: index,
    body: Option.getOrElse(
      Array.get(chatBodies, index % chatBodies.length),
      () => 'Message',
    ),
    isExpanded: index % 7 === 0,
  }))

export const init = (today: Calendar.CalendarDate): InitReturn => {
  const calendarBasicDemoInit = calendarBasicDemo.init({
    id: 'calendar-basic-demo',
    today,
    minDate: Calendar.subtractYears(today, 1),
    maxDate: Calendar.addYears(today, 1),
  })
  const datePickerBasicDemoInit = datePickerBasicDemo.init({
    id: 'date-picker-basic-demo',
    today,
    minDate: Calendar.subtractYears(today, 1),
    maxDate: Calendar.addYears(today, 1),
  })
  const comboboxDemoInit = comboboxDemo.init({ id: 'combobox-demo' })
  const comboboxPlacementLockDemoInit = comboboxPlacementLockDemo.init({
    id: 'combobox-placement-lock-demo',
  })
  const comboboxNullableDemoInit = comboboxNullableDemo.init({
    id: 'combobox-nullable-demo',
    nullable: true,
  })
  const comboboxMultiDemoInit = comboboxMultiDemo.init({
    id: 'combobox-multi-demo',
  })
  const comboboxSelectOnFocusDemoInit = comboboxSelectOnFocusDemo.init({
    id: 'combobox-select-on-focus-demo',
    selectInputOnFocus: true,
  })
  const dialogDemoInit = dialogDemo.init({ id: 'dialog-demo' })
  const dialogAnimatedDemoInit = dialogAnimatedDemo.init({
    id: 'dialog-animated-demo',
    isAnimated: true,
  })
  const overlayDialogDemoInit = overlayDialogDemo.init({
    id: 'overlay-dialog-demo',
  })
  const overlayComboboxDemoInit = overlayComboboxDemo.init({
    id: 'overlay-combobox-demo',
  })
  const nestedDialogParentDemoInit = nestedDialogParentDemo.init({
    id: 'nested-dialog-parent-demo',
  })
  const nestedDialogChildDemoInit = nestedDialogChildDemo.init({
    id: 'nested-dialog-child-demo',
  })
  const listboxDemoInit = listboxDemo.init({ id: 'listbox-demo' })
  const listboxMultiDemoInit = listboxMultiDemo.init({
    id: 'listbox-multi-demo',
  })
  const listboxGroupedDemoInit = listboxGroupedDemo.init({
    id: 'listbox-grouped-demo',
  })
  const menuBasicDemoInit = menuBasicDemo.init({ id: 'menu-basic-demo' })
  const menuAnimatedDemoInit = menuAnimatedDemo.init({
    id: 'menu-animated-demo',
    isAnimated: true,
  })
  const popoverBasicDemoInit = popoverBasicDemo.init({
    id: 'popover-basic-demo',
  })
  const popoverAnimatedDemoInit = popoverAnimatedDemo.init({
    id: 'popover-animated-demo',
    isAnimated: true,
  })
  const popoverArrowDemoInit = popoverArrowDemo.init({
    id: 'popover-arrow-demo',
  })
  const popoverNestedParentDemoInit = popoverNestedParentDemo.init({
    id: 'popover-nested-parent-demo',
    contentFocus: true,
  })
  const popoverNestedChildDemoInit = popoverNestedChildDemo.init({
    id: 'popover-nested-child-demo',
  })
  const verticalRadioGroupDemoInit = verticalRadioGroupDemo.init({
    id: 'vertical-radio-group-demo',
  })
  const horizontalRadioGroupDemoInit = horizontalRadioGroupDemo.init({
    id: 'horizontal-radio-group-demo',
  })
  const sliderRatingDemoInit = sliderRatingDemo.init({
    id: 'slider-rating-demo',
    min: 0,
    max: 10,
    step: 1,
  })
  const sliderVolumeDemoInit = sliderVolumeDemo.init({
    id: 'slider-volume-demo',
    min: 0,
    max: 1,
    step: 0.05,
  })
  const horizontalTabsDemoInit = horizontalTabsDemo.init({
    id: 'horizontal-tabs-demo',
  })
  const verticalTabsDemoInit = verticalTabsDemo.init({
    id: 'vertical-tabs-demo',
  })
  const dragAndDropDemoInit = dragAndDropDemo.init({
    id: 'drag-and-drop-demo',
  })
  const fileDropBasicDemoInit = fileDropBasicDemo.init({
    id: 'file-drop-basic-demo',
  })
  const toastDemoInit = toastDemo.init({
    id: 'toast-demo',
    swipeToDismiss: {},
  })
  const tooltipDemoInit = tooltipDemo.init({ id: 'tooltip-demo' })
  const hoverIntentCardDemoInit = hoverIntentCardDemo.init()
  const hoverIntentMenuDemoInit = hoverIntentMenuDemo.init()
  const animationDemoInit = animationDemo.init({ id: 'animation-demo' })
  const virtualListDemoInit = virtualListDemo.init({
    id: 'virtual-list-demo',
    rowHeightPx: 56,
  })
  const virtualListVariableDemoInit = virtualListVariableDemo.init({
    id: 'virtual-list-variable-demo',
    rowHeightPx: 56,
  })
  const virtualListChatDemoInit = virtualListChatDemo.init({
    id: 'virtual-list-chat-demo',
    rowHeightPx: 64,
    initialScroll: { target: ScrollTarget.End() },
    followEnd: { thresholdPx: 8 },
  })

  return {
    model: {
      buttonClickCount: 0,
      inputDemoValue: '',
      textareaDemoValue: '',
      fieldsetInputValue: '',
      fieldsetTextareaValue: '',
      isFieldsetCheckboxDemoChecked: false,
      calendarBasicDemo: calendarBasicDemoInit.model,
      maybeCalendarBasicDemoSelectedDate: Option.none(),
      datePickerBasicDemo: datePickerBasicDemoInit.model,
      maybeDatePickerBasicDemoSelectedDate: Option.none(),
      isCheckboxBasicDemoChecked: false,
      isCheckboxOptionADemoChecked: false,
      isCheckboxOptionBDemoChecked: false,
      comboboxDemo: comboboxDemoInit.model,
      maybeComboboxDemoSelectedCity: Option.none(),
      comboboxPlacementLockDemo: comboboxPlacementLockDemoInit.model,
      maybeComboboxPlacementLockDemoSelectedCity: Option.none(),
      comboboxNullableDemo: comboboxNullableDemoInit.model,
      maybeComboboxNullableDemoSelectedCity: Option.none(),
      comboboxMultiDemo: comboboxMultiDemoInit.model,
      comboboxMultiDemoSelectedCities: [],
      comboboxSelectOnFocusDemo: comboboxSelectOnFocusDemoInit.model,
      maybeComboboxSelectOnFocusDemoSelectedCity: Option.none(),
      dialogDemo: dialogDemoInit.model,
      dialogAnimatedDemo: dialogAnimatedDemoInit.model,
      overlayDialogDemo: overlayDialogDemoInit.model,
      overlayComboboxDemo: overlayComboboxDemoInit.model,
      maybeOverlayComboboxDemoSelectedCity: Option.none(),
      nestedDialogParentDemo: nestedDialogParentDemoInit.model,
      nestedDialogChildDemo: nestedDialogChildDemoInit.model,
      isDisclosureDemoOpen: false,
      isDisclosureCollapsedPreviewDemoOpen: false,
      listboxDemo: listboxDemoInit.model,
      maybeListboxDemoSelectedItem: Option.none(),
      listboxMultiDemo: listboxMultiDemoInit.model,
      listboxMultiDemoSelectedItems: [],
      listboxGroupedDemo: listboxGroupedDemoInit.model,
      maybeListboxGroupedDemoSelectedItem: Option.none(),
      menuBasicDemo: menuBasicDemoInit.model,
      menuAnimatedDemo: menuAnimatedDemoInit.model,
      popoverBasicDemo: popoverBasicDemoInit.model,
      popoverAnimatedDemo: popoverAnimatedDemoInit.model,
      popoverArrowDemo: popoverArrowDemoInit.model,
      popoverNestedParentDemo: popoverNestedParentDemoInit.model,
      popoverNestedChildDemo: popoverNestedChildDemoInit.model,
      verticalRadioGroupDemo: verticalRadioGroupDemoInit.model,
      verticalRadioGroupDemoValue: Option.none(),
      horizontalRadioGroupDemo: horizontalRadioGroupDemoInit.model,
      horizontalRadioGroupDemoValue: Option.none(),
      selectDemoValue: 'us',
      sliderRatingDemo: sliderRatingDemoInit.model,
      sliderRatingValue: 3,
      sliderVolumeDemo: sliderVolumeDemoInit.model,
      sliderVolumeValue: 0.5,
      isSwitchDemoChecked: false,
      horizontalTabsDemo: horizontalTabsDemoInit.model,
      horizontalTabsDemoTab: 'Foldkit',
      verticalTabsDemo: verticalTabsDemoInit.model,
      verticalTabsDemoTab: 'Foldkit',
      dragAndDropDemo: dragAndDropDemoInit.model,
      dragAndDropDemoAnnouncement: '',
      fileDropBasicDemo: fileDropBasicDemoInit.model,
      fileDropBasicDemoFiles: [],
      toastDemo: toastDemoInit.model,
      maybeLastDismissedToastTitle: Option.none(),
      tooltipDemo: tooltipDemoInit.model,
      hoverIntentCardDemo: hoverIntentCardDemoInit.model,
      hoverIntentMenuDemo: hoverIntentMenuDemoInit.model,
      animationDemo: animationDemoInit.model,
      virtualListDemo: virtualListDemoInit.model,
      virtualListVariableDemo: virtualListVariableDemoInit.model,
      virtualListChatDemo: virtualListChatDemoInit.model,
      virtualListChatMessages: initialVirtualListChatMessages,
      virtualListChatNextId: initialVirtualListChatMessages.length,
      virtualListChatStartProximity: VirtualListChatStartProximity.Away(),
      dragAndDropDemoColumns: [
        {
          id: 'backlog',
          label: 'Backlog',
          cards: [
            { id: 'card-1', label: 'Design API' },
            { id: 'card-2', label: 'Write tests' },
            { id: 'card-3', label: 'Build docs' },
          ],
        },
        {
          id: 'done',
          label: 'Done',
          cards: [
            { id: 'card-4', label: 'Set up repo' },
            { id: 'card-5', label: 'Add CI' },
          ],
        },
      ],
    },
    commands: [
      ...(calendarBasicDemoInit.commands ?? []),
      ...(datePickerBasicDemoInit.commands ?? []),
      ...(comboboxDemoInit.commands ?? []),
      ...(comboboxPlacementLockDemoInit.commands ?? []),
      ...(comboboxNullableDemoInit.commands ?? []),
      ...(comboboxMultiDemoInit.commands ?? []),
      ...(comboboxSelectOnFocusDemoInit.commands ?? []),
      ...(dialogDemoInit.commands ?? []),
      ...(dialogAnimatedDemoInit.commands ?? []),
      ...(overlayDialogDemoInit.commands ?? []),
      ...(overlayComboboxDemoInit.commands ?? []),
      ...(nestedDialogParentDemoInit.commands ?? []),
      ...(nestedDialogChildDemoInit.commands ?? []),
      ...(listboxDemoInit.commands ?? []),
      ...(listboxMultiDemoInit.commands ?? []),
      ...(listboxGroupedDemoInit.commands ?? []),
      ...(menuBasicDemoInit.commands ?? []),
      ...(menuAnimatedDemoInit.commands ?? []),
      ...(popoverBasicDemoInit.commands ?? []),
      ...(popoverAnimatedDemoInit.commands ?? []),
      ...(popoverArrowDemoInit.commands ?? []),
      ...(popoverNestedParentDemoInit.commands ?? []),
      ...(popoverNestedChildDemoInit.commands ?? []),
      ...(verticalRadioGroupDemoInit.commands ?? []),
      ...(horizontalRadioGroupDemoInit.commands ?? []),
      ...(sliderRatingDemoInit.commands ?? []),
      ...(sliderVolumeDemoInit.commands ?? []),
      ...(horizontalTabsDemoInit.commands ?? []),
      ...(verticalTabsDemoInit.commands ?? []),
      ...(dragAndDropDemoInit.commands ?? []),
      ...(fileDropBasicDemoInit.commands ?? []),
      ...(toastDemoInit.commands ?? []),
      ...(tooltipDemoInit.commands ?? []),
      ...(hoverIntentCardDemoInit.commands ?? []),
      ...(hoverIntentMenuDemoInit.commands ?? []),
      ...(animationDemoInit.commands ?? []),
      ...(virtualListDemoInit.commands ?? []),
      ...(virtualListVariableDemoInit.commands ?? []),
      ...(virtualListChatDemoInit.commands ?? []),
    ],
  }
}
