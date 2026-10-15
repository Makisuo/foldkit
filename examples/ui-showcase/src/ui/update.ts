import { Array, Number, Option } from 'effect'
import { modifyFields } from 'foldkit/struct'

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
  hoverIntentDemo,
  listboxDemo,
  listboxGroupedDemo,
  listboxMultiDemo,
  menuAnimatedDemo,
  menuBasicDemo,
  mobileMenuDialog,
  nestedDialogChildDemo,
  nestedDialogParentDemo,
  overlayComboboxDemo,
  overlayDialogDemo,
  popoverAnimatedDemo,
  popoverBasicDemo,
  popoverNestedChildDemo,
  popoverNestedParentDemo,
  sliderRatingDemo,
  sliderVolumeDemo,
  toastDemo,
  tooltipBasicDemo,
  tooltipNoDelayDemo,
  verticalRadioGroupDemo,
  verticalTabsDemo,
  virtualListDemo,
  virtualListVariableDemo,
} from './composition'
import { Ui } from './definition'
import { Message } from './message'
import { ROW_COUNT as VIRTUAL_LIST_ROW_COUNT } from './virtualList'

export const update = Ui.update((model, message) =>
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

export const openMobileMenu = Ui.step(mobileMenuDialog.open())

export const closeMobileMenu = Ui.step(mobileMenuDialog.close())
