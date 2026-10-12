import { Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Menu, Tabs } from '@foldkit/ui'

import { ExampleSlug } from '../example/meta'
import { asyncCounterDemo, notePlayerDemo } from './bindings'
import { contract } from './definition'
import * as DemoTab from './demoTab'
import { Message, OutMessage } from './message'
import { type Model } from './model'

// UPDATE

const PlaygroundMenu = Menu.create<ExampleSlug>()

const selectDemoTab = (model: Model, tab: DemoTab.Tab) => ({
  model: modifyFields(model, { activeDemoTab: () => tab }),
})

const selectPlaygroundExample = (model: Model, exampleSlug: ExampleSlug) => ({
  model,
  outMessage: OutMessage.SelectedPlaygroundExample({ exampleSlug }),
})

const foldDemoTabsOutMessage = Tabs.OutMessage.match<
  Update.Step<Model, Message>,
  Tabs.OutMessage<DemoTab.Tab>
>({
  Selected:
    ({ value }) =>
    model =>
      selectDemoTab(model, value),
})

const foldDemoTabs = Update.foldChild({
  update: DemoTab.DemoTabs.update,
  read: (model: Model) => Option.some(model.demoTabs),
  write: (model, nextDemoTabs) =>
    modifyFields(model, { demoTabs: () => nextDemoTabs }),
  toParentMessage: message => Message.GotDemoTabsMessage({ message }),
  foldOutMessage: foldDemoTabsOutMessage,
})

const foldPlaygroundMenuOutMessage = Menu.OutMessage.match<
  Update.StepWithOutMessage<Model, Message, OutMessage>,
  Menu.OutMessage<ExampleSlug>
>({
  // NOTE: A fresh document load preserves the COEP/COOP headers required by
  // WebContainer. SPA navigation would reuse the current document.
  Selected:
    ({ value }) =>
    model =>
      selectPlaygroundExample(model, value),
})

const foldPlaygroundMenu = Update.foldChild({
  update: PlaygroundMenu.update,
  read: (model: Model) => Option.some(model.playgroundMenu),
  write: (model, nextPlaygroundMenu) =>
    modifyFields(model, { playgroundMenu: () => nextPlaygroundMenu }),
  toParentMessage: message => Message.GotPlaygroundMenuMessage({ message }),
  foldOutMessage: foldPlaygroundMenuOutMessage,
})

export const update = contract.defineUpdate((model, message) =>
  Message.match(message, {
    GotDemoTabsMessage: ({ message }) => foldDemoTabs(model, message),
    GotPlaygroundMenuMessage: ({ message }) =>
      foldPlaygroundMenu(model, message),
    GotAsyncCounterDemoMessage: ({ message }) =>
      asyncCounterDemo.fold(model, message),
    GotNotePlayerDemoMessage: ({ message }) =>
      notePlayerDemo.fold(model, message),
  }),
)
