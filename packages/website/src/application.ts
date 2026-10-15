import { Layer } from 'effect'
import { type Block, Update } from 'foldkit'

import { Dialog } from '@foldkit/ui'

import * as Command from './command'
import { LoadPlayground, home } from './composition/home'
import { Application } from './definition'
import { Message } from './message'
import { Model } from './model'
import {
  ApiReference,
  ComingFromReact,
  CoreBlockPage,
  ExampleDetail,
  Playground,
  Ui,
} from './page'
import * as Search from './search'
import * as SnippetCopy from './snippetCopy'
import * as SnippetDisclosure from './snippetDisclosure'
import * as Subscription from './subscription'
import { selectThemePreference } from './theme'
import { ThemeMenu } from './view/themeMenu'

export { Application } from './definition'
export { home, LoadPlayground } from './composition/home'

export const search = Application.bindChild(Search.block, {
  field: 'search',
  parentMessage: Message.GotSearchMessage,
})

export const snippetCopy = Application.bindChild(SnippetCopy.block, {
  field: 'snippetCopy',
  parentMessage: Message.GotSnippetCopyMessage,
})

export const snippetDisclosure = Application.bindChild(
  SnippetDisclosure.block,
  {
    field: 'snippetDisclosure',
    parentMessage: Message.GotSnippetDisclosureMessage,
  },
)

export const exampleDetail = Application.bindChild(ExampleDetail.block, {
  field: 'exampleDetail',
  parentMessage: Message.GotExampleDetailMessage,
})

export const playground = Application.bindChild(Playground.block, {
  field: 'playground',
  parentMessage: Message.GotPlaygroundMessage,
})

export const uiPages = Application.bindChild(Ui.block, {
  field: 'uiPages',
  parentMessage: Message.GotUiPageMessage,
})

export const apiReference = Application.bindChild(ApiReference.block, {
  field: 'apiReference',
  parentMessage: Message.GotApiReferenceMessage,
})

export const comingFromReact = Application.bindChild(ComingFromReact.block, {
  field: 'comingFromReact',
  parentMessage: Message.GotComingFromReactMessage,
})

export const coreBlockPage = Application.bindChild(CoreBlockPage.block, {
  field: 'coreBlockPage',
  parentMessage: Message.GotCoreBlockPageMessage,
})

const foldMobileMenuDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

export const mobileMenuDialog = Application.bindChild(Dialog.block, {
  field: 'mobileMenuDialog',
  parentMessage: Message.GotMobileMenuDialogMessage,
  outMessage: { fold: foldMobileMenuDialogOutMessage },
})

const foldThemeMenuOutMessage = ThemeMenu.OutMessage.match({
  Selected: ({ value }) => selectThemePreference(value),
})

export const themeMenu = Application.bindChild(ThemeMenu, {
  field: 'themeMenu',
  parentMessage: Message.GotThemeMenuMessage,
  outMessage: { fold: foldThemeMenuOutMessage },
})

export const ApplicationComposition = Application.toComposition({
  children: [
    apiReference,
    comingFromReact,
    coreBlockPage,
    exampleDetail,
    home,
    mobileMenuDialog,
    playground,
    search,
    snippetCopy,
    snippetDisclosure,
    themeMenu,
    uiPages,
  ],
})

export type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>

export const EffectsLayer = Layer.mergeAll(
  Command.EffectsLayer,
  LoadPlayground.layer,
  Subscription.EffectsLayer,
)
