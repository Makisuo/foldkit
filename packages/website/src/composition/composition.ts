import { Option, pipe } from 'effect'
import { type Block } from 'foldkit'

import { Dialog } from '@foldkit/ui'

import { ApplicationDefinition } from '../definition'
import { Message } from '../message'
import {
  ApiReference,
  ComingFromReact,
  CoreBlockPage,
  ExampleDetail,
  Playground,
  Ui,
} from '../page'
import { ApplicationRoute } from '../route'
import * as Search from '../search'
import * as SnippetCopy from '../snippetCopy'
import * as SnippetDisclosure from '../snippetDisclosure'
import { selectThemePreference } from '../theme'
import { ThemeMenu } from '../view'
import { HomeBinding } from './home'

export const SearchBinding = ApplicationDefinition.bindChild(Search.block, {
  field: 'search',
  parentMessage: Message.GotSearchMessage,
})

export const SnippetCopyBinding = ApplicationDefinition.bindChild(
  SnippetCopy.block,
  {
    field: 'snippetCopy',
    parentMessage: Message.GotSnippetCopyMessage,
  },
)

export const SnippetDisclosureBinding = ApplicationDefinition.bindChild(
  SnippetDisclosure.block,
  {
    field: 'snippetDisclosure',
    parentMessage: Message.GotSnippetDisclosureMessage,
  },
)

export const ExampleDetailBinding = ApplicationDefinition.bindChild(
  ExampleDetail.block,
  {
    field: 'exampleDetail',
    parentMessage: Message.GotExampleDetailMessage,
  },
)

export const PlaygroundBinding = ApplicationDefinition.bindChild(
  Playground.block,
  {
    field: 'playground',
    parentMessage: Message.GotPlaygroundMessage,
    init: {
      startupToArgs: ({ route }) =>
        pipe(
          route,
          Option.liftPredicate(ApplicationRoute.guards.Playground),
          Option.map(route => [route.exampleSlug]),
        ),
    },
  },
)

export const UiPagesBinding = ApplicationDefinition.bindChild(Ui.block, {
  field: 'uiPages',
  parentMessage: Message.GotUiPageMessage,
  init: { startupToArgs: ({ today }) => [today] },
})

export const ApiReferenceBinding = ApplicationDefinition.bindChild(
  ApiReference.block,
  {
    field: 'apiReference',
    parentMessage: Message.GotApiReferenceMessage,
  },
)

export const ComingFromReactBinding = ApplicationDefinition.bindChild(
  ComingFromReact.block,
  {
    field: 'comingFromReact',
    parentMessage: Message.GotComingFromReactMessage,
  },
)

export const CoreBlockPageBinding = ApplicationDefinition.bindChild(
  CoreBlockPage.block,
  {
    field: 'coreBlockPage',
    parentMessage: Message.GotCoreBlockPageMessage,
  },
)

const foldMobileMenuDialogOutMessage = Dialog.OutMessage.match({
  Opened: () => ApplicationDefinition.step(model => ({ model })),
  Closed: () => ApplicationDefinition.step(model => ({ model })),
  CompletedClose: () => ApplicationDefinition.step(model => ({ model })),
})

export const MobileMenuDialogBinding = ApplicationDefinition.bindChild(
  Dialog.block,
  {
    field: 'mobileMenuDialog',
    parentMessage: Message.GotMobileMenuDialogMessage,
    outMessage: { fold: foldMobileMenuDialogOutMessage },
    init: { startupToArgs: () => [{ id: 'mobile-menu' }] },
  },
)

const foldThemeMenuOutMessage = ThemeMenu.ThemeMenu.OutMessage.match({
  Selected: ({ value }) => selectThemePreference(value),
})

export const ThemeMenuBinding = ApplicationDefinition.bindChild(
  ThemeMenu.ThemeMenu,
  {
    field: 'themeMenu',
    parentMessage: Message.GotThemeMenuMessage,
    outMessage: { fold: foldThemeMenuOutMessage },
    init: { startupToArgs: () => [{ id: 'theme-menu' }] },
  },
)

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [
    ApiReferenceBinding,
    ComingFromReactBinding,
    CoreBlockPageBinding,
    ExampleDetailBinding,
    HomeBinding,
    MobileMenuDialogBinding,
    PlaygroundBinding,
    SearchBinding,
    SnippetCopyBinding,
    SnippetDisclosureBinding,
    ThemeMenuBinding,
    UiPagesBinding,
  ],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
