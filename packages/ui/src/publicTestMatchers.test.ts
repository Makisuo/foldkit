import { expect, it } from 'vitest'

import {
  AcquireResources,
  CloseDialog,
  ReleaseDialogResources,
  ShowDialog,
} from './dialog/block.js'
import * as Dialog from './dialog/public.js'
import * as Listbox from './listbox/public.js'
import {
  AnchorListbox,
  FocusListboxButton,
  FocusListboxItems,
  PortalListboxBackdrop,
} from './listbox/shared.js'
import { FocusMenuButton, FocusMenuItems } from './menu/menu.js'
import * as Menu from './menu/public.js'
import { AnchorPopover } from './popover/block.js'
import * as Popover from './popover/public.js'
import * as RadioGroup from './radioGroup/public.js'
import { FocusOption } from './radioGroup/radioGroup.js'
import * as Tabs from './tabs/public.js'
import { FocusTab } from './tabs/tabs.js'

it('publishes the original Command Definitions through test namespaces', () => {
  expect(Dialog.test.AcquireResources).toBe(AcquireResources)
  expect(Dialog.test.CloseDialog).toBe(CloseDialog)
  expect(Dialog.test.ReleaseDialogResources).toBe(ReleaseDialogResources)
  expect(Dialog.test.ShowDialog).toBe(ShowDialog)
  expect(Listbox.test.FocusListboxButton).toBe(FocusListboxButton)
  expect(Listbox.test.FocusListboxItems).toBe(FocusListboxItems)
  expect(Listbox.test.AnchorListbox).toBe(AnchorListbox)
  expect(Listbox.test.PortalListboxBackdrop).toBe(PortalListboxBackdrop)
  expect(Menu.test.FocusMenuButton).toBe(FocusMenuButton)
  expect(Menu.test.FocusMenuItems).toBe(FocusMenuItems)
  expect(Popover.test.AnchorPopover).toBe(AnchorPopover)
  expect(RadioGroup.test.FocusOption).toBe(FocusOption)
  expect(Tabs.test.FocusTab).toBe(FocusTab)
})
