import { Effect, Option } from 'effect'
import { type Block, Update } from 'foldkit'
import { load } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'

import { Dialog } from '@foldkit/ui'

import { Application } from './definition'
import { Message } from './message'
import { Model } from './model'
import {
  ApiReference,
  ComingFromReact,
  CoreBlockPage,
  ExampleDetail,
  Home,
  Playground,
  Ui,
} from './page'
import { ExampleSlug } from './page/example/meta'
import { playgroundRouter } from './route'
import * as Search from './search'
import * as SnippetCopy from './snippetCopy'
import * as SnippetDisclosure from './snippetDisclosure'
import { selectThemePreference } from './theme'
import { ThemeMenu } from './view/themeMenu'

export const LoadPlayground = Application.command('LoadPlayground', {
  args: { exampleSlug: ExampleSlug },
  messages: [Message.CompletedLoadPlayground],
  handler: function* () {
    return ({ exampleSlug }) =>
      load(playgroundRouter({ exampleSlug })).pipe(
        Effect.as(Message.CompletedLoadPlayground()),
      )
  },
})

const loadPlaygroundExample = (exampleSlug: ExampleSlug) => (model: Model) => ({
  model,
  commands: [LoadPlayground({ exampleSlug })],
})

const foldHomeOutMessage = Home.OutMessage.match({
  SelectedPlaygroundExample: ({ exampleSlug }) =>
    loadPlaygroundExample(exampleSlug),
})

export const home = Application.bindChild(Home.block, {
  read: (model: Model) => model.maybeHome,
  write: (model, nextHome) =>
    modifyFields(model, { maybeHome: () => Option.some(nextHome) }),
  parentMessage: Message.GotHomeMessage,
  outMessage: {
    fold: foldHomeOutMessage,
  },
})

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
  read: (model: Model) => model.playground,
  write: (model: Model, nextPlayground: typeof Playground.Model.Type) =>
    modifyFields(model, { playground: () => Option.some(nextPlayground) }),
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

export const children = [
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
] as const

export type ViewRequirements = Block.RequirementsOfBindings<typeof children>
