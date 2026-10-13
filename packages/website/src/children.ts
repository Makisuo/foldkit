import { Effect, Option } from 'effect'
import { type Block, Update } from 'foldkit'
import { load } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'

import { Dialog } from '@foldkit/ui'

import * as Authoring from './definition'
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

export const LoadPlayground = Authoring.Application.command('LoadPlayground', {
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

const foldHomeOutMessage = Home.OutMessage.match<
  ReturnType<typeof loadPlaygroundExample>
>({
  SelectedPlaygroundExample: ({ exampleSlug }) =>
    loadPlaygroundExample(exampleSlug),
})

export const home = Home.block.connection({
  read: (model: Model) => model.maybeHome,
  write: (model, nextHome) =>
    modifyFields(model, { maybeHome: () => Option.some(nextHome) }),
  parentMessage: Message.GotHomeMessage,
  outMessage: {
    fold: foldHomeOutMessage,
  },
})

export const search = Search.block.connection({
  Model,
  field: 'search',
  parentMessage: Message.GotSearchMessage,
})

export const snippetCopy = SnippetCopy.block.connection({
  Model,
  field: 'snippetCopy',
  parentMessage: Message.GotSnippetCopyMessage,
})

export const snippetDisclosure = SnippetDisclosure.block.connection({
  Model,
  field: 'snippetDisclosure',
  parentMessage: Message.GotSnippetDisclosureMessage,
})

export const exampleDetail = ExampleDetail.block.connection({
  Model,
  field: 'exampleDetail',
  parentMessage: Message.GotExampleDetailMessage,
})

export const playground = Playground.block.connection({
  read: (model: Model) => model.playground,
  write: (model: Model, nextPlayground: typeof Playground.Model.Type) =>
    modifyFields(model, { playground: () => Option.some(nextPlayground) }),
  parentMessage: Message.GotPlaygroundMessage,
})

export const uiPages = Ui.block.connection({
  Model,
  field: 'uiPages',
  parentMessage: Message.GotUiPageMessage,
})

export const apiReference = ApiReference.block.connection({
  Model,
  field: 'apiReference',
  parentMessage: Message.GotApiReferenceMessage,
})

export const comingFromReact = ComingFromReact.block.connection({
  Model,
  field: 'comingFromReact',
  parentMessage: Message.GotComingFromReactMessage,
})

export const coreBlockPage = CoreBlockPage.block.connection({
  Model,
  field: 'coreBlockPage',
  parentMessage: Message.GotCoreBlockPageMessage,
})

const foldMobileMenuDialogOutMessage = Dialog.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

export const mobileMenuDialog = Dialog.block.connection({
  Model,
  field: 'mobileMenuDialog',
  parentMessage: Message.GotMobileMenuDialogMessage,
  outMessage: { fold: foldMobileMenuDialogOutMessage },
})

const foldThemeMenuOutMessage = ThemeMenu.OutMessage.match<
  ReturnType<typeof selectThemePreference>
>({
  Selected: ({ value }) => selectThemePreference(value),
})

export const themeMenu = ThemeMenu.connection({
  Model,
  field: 'themeMenu',
  parentMessage: Message.GotThemeMenuMessage,
  outMessage: { fold: foldThemeMenuOutMessage },
})

export type ViewRequirements = Block.RequirementsOfConnections<
  typeof Application.children
>

export const Application = Authoring.Application.register({
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
