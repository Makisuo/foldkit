import { Array, Option } from 'effect'
import { type Block, Calendar as FoldkitCalendar } from 'foldkit'

import {
  CalendarBlock,
  DatePickerBlock,
  DialogBlock,
  FileDropBlock,
  HoverIntentBlock,
  PopoverBlock,
  SliderBlock,
  TooltipBlock,
} from '@foldkit/ui'

import { CityComboboxBlock, CityMultiComboboxBlock } from '../combobox'
import { UiDefinition } from '../definition'
import {
  CharacterListboxBlock,
  ItemListboxBlock,
  ItemMultiListboxBlock,
} from '../listbox'
import { DemoMenuBlock } from '../menu'
import { PlanRadioGroupBlock } from '../radioGroup'
import { DemoTabsBlock } from '../tabs'
import { ToastBlock } from '../toast'
import { ActivityVirtualListBlock } from '../virtualList'
import { AnimationDemoBindingWithOutMessagePolicy } from './animation'
import { DragAndDropDemoBinding } from './dragAndDrop'

const foldDialogOutMessage = UiDefinition.makeOutMessageFold(DialogBlock, {
  Opened: UiDefinition.stepNoop,
  Closed: UiDefinition.stepNoop,
  CompletedClose: UiDefinition.stepNoop,
})

const foldMenuOutMessage = UiDefinition.makeOutMessageFold(DemoMenuBlock, {
  Selected: UiDefinition.stepNoop,
  Closed: UiDefinition.stepNoop,
})

const foldPopoverOutMessage = UiDefinition.makeOutMessageFold(PopoverBlock, {
  Opened: UiDefinition.stepNoop,
  Closed: UiDefinition.stepNoop,
})

const foldTooltipOutMessage = UiDefinition.makeOutMessageFold(TooltipBlock, {
  Shown: UiDefinition.stepNoop,
  Hidden: UiDefinition.stepNoop,
})

export const MobileMenuDialogBinding = UiDefinition.bindChild(DialogBlock, {
  field: 'mobileMenuDialog',
  init: { contextToArgs: () => [{ id: 'mobile-menu' }] },
}).withOutMessagePolicy({ fold: foldDialogOutMessage })

export const ComboboxDemoBinding = UiDefinition.bindChild(CityComboboxBlock, {
  field: 'comboboxDemo',
  init: { contextToArgs: () => [{ id: 'combobox-demo' }] },
}).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(CityComboboxBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({
        maybeComboboxDemoSelectedCity: () => Option.some(value),
      })),
    ClearedSelection: UiDefinition.stepNoop,
  }),
})

export const ComboboxNullableDemoBinding = UiDefinition.bindChild(
  CityComboboxBlock,
  {
    field: 'comboboxNullableDemo',
    init: {
      contextToArgs: () => [{ id: 'combobox-nullable-demo', nullable: true }],
    },
  },
).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(CityComboboxBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({
        maybeComboboxNullableDemoSelectedCity:
          maybeComboboxNullableDemoSelectedCity =>
            Option.contains(maybeComboboxNullableDemoSelectedCity, value)
              ? Option.none()
              : Option.some(value),
      })),
    ClearedSelection: () =>
      UiDefinition.stepFields(() => ({
        maybeComboboxNullableDemoSelectedCity: () => Option.none(),
      })),
  }),
})

export const ComboboxMultiDemoBinding = UiDefinition.bindChild(
  CityMultiComboboxBlock,
  {
    field: 'comboboxMultiDemo',
    init: { contextToArgs: () => [{ id: 'combobox-multi-demo' }] },
  },
).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(CityMultiComboboxBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({
        comboboxMultiDemoSelectedCities: comboboxMultiDemoSelectedCities =>
          Array.contains(comboboxMultiDemoSelectedCities, value)
            ? Array.filter(
                comboboxMultiDemoSelectedCities,
                city => city !== value,
              )
            : Array.append(comboboxMultiDemoSelectedCities, value),
      })),
    ClearedSelection: UiDefinition.stepNoop,
  }),
})

export const ComboboxPlacementLockDemoBinding = UiDefinition.bindChild(
  CityComboboxBlock,
  {
    field: 'comboboxPlacementLockDemo',
    init: { contextToArgs: () => [{ id: 'combobox-placement-lock-demo' }] },
  },
).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(CityComboboxBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({
        maybeComboboxPlacementLockDemoSelectedCity: () => Option.some(value),
      })),
    ClearedSelection: UiDefinition.stepNoop,
  }),
})

export const ComboboxSelectOnFocusDemoBinding = UiDefinition.bindChild(
  CityComboboxBlock,
  {
    field: 'comboboxSelectOnFocusDemo',
    init: {
      contextToArgs: () => [
        { id: 'combobox-select-on-focus-demo', selectInputOnFocus: true },
      ],
    },
  },
).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(CityComboboxBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({
        maybeComboboxSelectOnFocusDemoSelectedCity: () => Option.some(value),
      })),
    ClearedSelection: UiDefinition.stepNoop,
  }),
})

export const DialogDemoBinding = UiDefinition.bindChild(DialogBlock, {
  field: 'dialogDemo',
  init: { contextToArgs: () => [{ id: 'dialog-demo' }] },
}).withOutMessagePolicy({ fold: foldDialogOutMessage })

export const DialogAnimatedDemoBinding = UiDefinition.bindChild(DialogBlock, {
  field: 'dialogAnimatedDemo',
  init: {
    contextToArgs: () => [{ id: 'dialog-animated-demo', isAnimated: true }],
  },
}).withOutMessagePolicy({ fold: foldDialogOutMessage })

export const OverlayDialogDemoBinding = UiDefinition.bindChild(DialogBlock, {
  field: 'overlayDialogDemo',
  init: { contextToArgs: () => [{ id: 'overlay-dialog-demo' }] },
}).withOutMessagePolicy({ fold: foldDialogOutMessage })

export const OverlayComboboxDemoBinding = UiDefinition.bindChild(
  CityComboboxBlock,
  {
    field: 'overlayComboboxDemo',
    init: { contextToArgs: () => [{ id: 'overlay-combobox-demo' }] },
  },
).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(CityComboboxBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({
        maybeOverlayComboboxDemoSelectedCity: () => Option.some(value),
      })),
    ClearedSelection: UiDefinition.stepNoop,
  }),
})

export const NestedDialogParentDemoBinding = UiDefinition.bindChild(
  DialogBlock,
  {
    field: 'nestedDialogParentDemo',
    init: { contextToArgs: () => [{ id: 'nested-dialog-parent-demo' }] },
  },
).withOutMessagePolicy({ fold: foldDialogOutMessage })

export const NestedDialogChildDemoBinding = UiDefinition.bindChild(
  DialogBlock,
  {
    field: 'nestedDialogChildDemo',
    init: { contextToArgs: () => [{ id: 'nested-dialog-child-demo' }] },
  },
).withOutMessagePolicy({ fold: foldDialogOutMessage })

export const CalendarBasicDemoBinding = UiDefinition.bindChild(CalendarBlock, {
  field: 'calendarBasicDemo',
  init: {
    contextToArgs: today => [
      {
        id: 'calendar-basic-demo',
        today,
        minDate: FoldkitCalendar.subtractYears(today, 1),
        maxDate: FoldkitCalendar.addYears(today, 1),
      },
    ],
  },
}).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(CalendarBlock, {
    SelectedDate: ({ date }) =>
      UiDefinition.stepFields(() => ({
        maybeCalendarBasicDemoSelectedDate: () => Option.some(date),
      })),
    ChangedViewMonth: UiDefinition.stepNoop,
  }),
})

export const DatePickerBasicDemoBinding = UiDefinition.bindChild(
  DatePickerBlock,
  {
    field: 'datePickerBasicDemo',
    init: {
      contextToArgs: today => [
        {
          id: 'date-picker-basic-demo',
          today,
          minDate: FoldkitCalendar.subtractYears(today, 1),
          maxDate: FoldkitCalendar.addYears(today, 1),
        },
      ],
    },
  },
).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(DatePickerBlock, {
    SelectedDate: ({ date }) =>
      UiDefinition.stepFields(() => ({
        maybeDatePickerBasicDemoSelectedDate: () => Option.some(date),
      })),
    ClearedDate: () =>
      UiDefinition.stepFields(() => ({
        maybeDatePickerBasicDemoSelectedDate: () => Option.none(),
      })),
    ChangedViewMonth: UiDefinition.stepNoop,
  }),
})

export const FileDropBasicDemoBinding = UiDefinition.bindChild(FileDropBlock, {
  field: 'fileDropBasicDemo',
  init: { contextToArgs: () => [{ id: 'file-drop-basic-demo' }] },
}).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(FileDropBlock, {
    ReceivedFiles: ({ files }) =>
      UiDefinition.stepFields(() => ({
        fileDropBasicDemoFiles: Array.appendAll(files),
      })),
    RejectedNonFiles: UiDefinition.stepNoop,
  }),
})

export const ListboxDemoBinding = UiDefinition.bindChild(ItemListboxBlock, {
  field: 'listboxDemo',
  init: { contextToArgs: () => [{ id: 'listbox-demo' }] },
}).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(ItemListboxBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({
        maybeListboxDemoSelectedItem: () => Option.some(value),
      })),
  }),
})

export const ListboxMultiDemoBinding = UiDefinition.bindChild(
  ItemMultiListboxBlock,
  {
    field: 'listboxMultiDemo',
    init: { contextToArgs: () => [{ id: 'listbox-multi-demo' }] },
  },
).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(ItemMultiListboxBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({
        listboxMultiDemoSelectedItems: listboxMultiDemoSelectedItems =>
          Array.contains(listboxMultiDemoSelectedItems, value)
            ? Array.filter(
                listboxMultiDemoSelectedItems,
                item => item !== value,
              )
            : Array.append(listboxMultiDemoSelectedItems, value),
      })),
  }),
})

export const ListboxGroupedDemoBinding = UiDefinition.bindChild(
  CharacterListboxBlock,
  {
    field: 'listboxGroupedDemo',
    init: { contextToArgs: () => [{ id: 'listbox-grouped-demo' }] },
  },
).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(CharacterListboxBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({
        maybeListboxGroupedDemoSelectedItem: () => Option.some(value),
      })),
  }),
})

export const MenuBasicDemoBinding = UiDefinition.bindChild(DemoMenuBlock, {
  field: 'menuBasicDemo',
  init: { contextToArgs: () => [{ id: 'menu-basic-demo' }] },
}).withOutMessagePolicy({ fold: foldMenuOutMessage })

export const MenuAnimatedDemoBinding = UiDefinition.bindChild(DemoMenuBlock, {
  field: 'menuAnimatedDemo',
  init: {
    contextToArgs: () => [{ id: 'menu-animated-demo', isAnimated: true }],
  },
}).withOutMessagePolicy({ fold: foldMenuOutMessage })

export const PopoverBasicDemoBinding = UiDefinition.bindChild(PopoverBlock, {
  field: 'popoverBasicDemo',
  init: { contextToArgs: () => [{ id: 'popover-basic-demo' }] },
}).withOutMessagePolicy({ fold: foldPopoverOutMessage })

export const PopoverAnimatedDemoBinding = UiDefinition.bindChild(PopoverBlock, {
  field: 'popoverAnimatedDemo',
  init: {
    contextToArgs: () => [{ id: 'popover-animated-demo', isAnimated: true }],
  },
}).withOutMessagePolicy({ fold: foldPopoverOutMessage })

export const PopoverNestedParentDemoBinding = UiDefinition.bindChild(
  PopoverBlock,
  {
    field: 'popoverNestedParentDemo',
    init: {
      contextToArgs: () => [
        { id: 'popover-nested-parent-demo', contentFocus: true },
      ],
    },
  },
).withOutMessagePolicy({ fold: foldPopoverOutMessage })

export const PopoverNestedChildDemoBinding = UiDefinition.bindChild(
  PopoverBlock,
  {
    field: 'popoverNestedChildDemo',
    init: { contextToArgs: () => [{ id: 'popover-nested-child-demo' }] },
  },
).withOutMessagePolicy({ fold: foldPopoverOutMessage })

export const VerticalRadioGroupDemoBinding = UiDefinition.bindChild(
  PlanRadioGroupBlock,
  {
    field: 'verticalRadioGroupDemo',
    init: { contextToArgs: () => [{ id: 'vertical-radio-group-demo' }] },
  },
).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(PlanRadioGroupBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({
        verticalRadioGroupDemoValue: () => Option.some(value),
      })),
  }),
})

export const HorizontalRadioGroupDemoBinding = UiDefinition.bindChild(
  PlanRadioGroupBlock,
  {
    field: 'horizontalRadioGroupDemo',
    init: { contextToArgs: () => [{ id: 'horizontal-radio-group-demo' }] },
  },
).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(PlanRadioGroupBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({
        horizontalRadioGroupDemoValue: () => Option.some(value),
      })),
  }),
})

export const SliderRatingDemoBinding = UiDefinition.bindChild(SliderBlock, {
  field: 'sliderRatingDemo',
  init: {
    contextToArgs: () => [
      { id: 'slider-rating-demo', min: 0, max: 10, step: 1 },
    ],
  },
}).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(SliderBlock, {
    ChangedValue: ({ value }) =>
      UiDefinition.stepFields(() => ({ sliderRatingValue: () => value })),
  }),
})

export const SliderVolumeDemoBinding = UiDefinition.bindChild(SliderBlock, {
  field: 'sliderVolumeDemo',
  init: {
    contextToArgs: () => [
      { id: 'slider-volume-demo', min: 0, max: 1, step: 0.05 },
    ],
  },
}).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(SliderBlock, {
    ChangedValue: ({ value }) =>
      UiDefinition.stepFields(() => ({ sliderVolumeValue: () => value })),
  }),
})

export const HorizontalTabsDemoBinding = UiDefinition.bindChild(DemoTabsBlock, {
  field: 'horizontalTabsDemo',
  init: { contextToArgs: () => [{ id: 'horizontal-tabs-demo' }] },
}).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(DemoTabsBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({ horizontalTabsDemoTab: () => value })),
  }),
})

export const VerticalTabsDemoBinding = UiDefinition.bindChild(DemoTabsBlock, {
  field: 'verticalTabsDemo',
  init: { contextToArgs: () => [{ id: 'vertical-tabs-demo' }] },
}).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(DemoTabsBlock, {
    Selected: ({ value }) =>
      UiDefinition.stepFields(() => ({ verticalTabsDemoTab: () => value })),
  }),
})

export const ToastDemoBinding = UiDefinition.bindChild(ToastBlock, {
  field: 'toastDemo',
  init: { contextToArgs: () => [{ id: 'toast-demo', swipeToDismiss: {} }] },
}).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(ToastBlock, {
    DismissedToast: UiDefinition.stepNoop,
  }),
})

export const TooltipBasicDemoBinding = UiDefinition.bindChild(TooltipBlock, {
  field: 'tooltipBasicDemo',
  init: { contextToArgs: () => [{ id: 'tooltip-basic-demo' }] },
}).withOutMessagePolicy({ fold: foldTooltipOutMessage })

export const TooltipNoDelayDemoBinding = UiDefinition.bindChild(TooltipBlock, {
  field: 'tooltipNoDelayDemo',
  init: {
    contextToArgs: () => [{ id: 'tooltip-no-delay-demo', showDelay: 0 }],
  },
}).withOutMessagePolicy({ fold: foldTooltipOutMessage })

export const HoverIntentDemoBinding = UiDefinition.bindChild(HoverIntentBlock, {
  field: 'hoverIntentDemo',
}).withOutMessagePolicy({
  fold: UiDefinition.makeOutMessageFold(HoverIntentBlock, {
    Opened: UiDefinition.stepNoop,
    Closed: UiDefinition.stepNoop,
  }),
})

const foldVirtualListOutMessage = UiDefinition.makeOutMessageFold(
  ActivityVirtualListBlock,
  {
    ObservedContainerScroll: UiDefinition.stepNoop,
  },
)

export const VirtualListDemoBinding = UiDefinition.bindChild(
  ActivityVirtualListBlock,
  {
    field: 'virtualListDemo',
    init: {
      contextToArgs: () => [{ id: 'virtual-list-demo', rowHeightPx: 56 }],
    },
  },
).withOutMessagePolicy({ fold: foldVirtualListOutMessage })

export const VirtualListVariableDemoBinding = UiDefinition.bindChild(
  ActivityVirtualListBlock,
  {
    field: 'virtualListVariableDemo',
    init: {
      contextToArgs: () => [
        { id: 'virtual-list-variable-demo', rowHeightPx: 56 },
      ],
    },
  },
).withOutMessagePolicy({ fold: foldVirtualListOutMessage })

export const UiComposition = UiDefinition.makeComposition({
  bindings: [
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
    AnimationDemoBindingWithOutMessagePolicy,
    VirtualListDemoBinding,
    VirtualListVariableDemoBinding,
  ],
})
export type UiViewBuilder = Block.ViewBuilderFor<typeof UiComposition>
