import { Array, Match, Number, Option, pipe } from 'effect'
import { Update } from 'foldkit'
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
} from './composition'
import { Ui } from './definition'
import { ROW_COUNT as VIRTUAL_LIST_ROW_COUNT } from './demo/virtualListData'
import { Message } from './message'
import {
  type Model,
  type VirtualListChatMessage,
  VirtualListChatStartProximity,
} from './model'

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
