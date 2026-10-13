import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import * as AsyncCounterDemo from './asyncCounterDemo'
import * as DemoTab from './demoTab'
import { Message, OutMessage } from './message'
import { Model } from './model'
import * as NotePlayerDemo from './notePlayerDemo'
import { PlaygroundMenu } from './playgroundMenu'

const foldDemoTabsOutMessage = DemoTab.DemoTabs.OutMessage.match<
  Update.Step<Model, Message>,
  typeof DemoTab.DemoTabs.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { activeDemoTab: () => value }),
    }),
})

export const demoTabs = DemoTab.DemoTabs.connection({
  Model,
  field: 'demoTabs',
  parentMessage: Message.GotDemoTabsMessage,
  outMessage: { fold: foldDemoTabsOutMessage },
})

const foldPlaygroundMenuOutMessage = PlaygroundMenu.OutMessage.match<
  Update.StepWithOutMessage<Model, Message, OutMessage>,
  typeof PlaygroundMenu.OutMessage.Type
>({
  Selected:
    ({ value }) =>
    model => ({
      model,
      outMessage: OutMessage.SelectedPlaygroundExample({ exampleSlug: value }),
    }),
})

export const playgroundMenu = PlaygroundMenu.connection({
  Model,
  field: 'playgroundMenu',
  parentMessage: Message.GotPlaygroundMenuMessage,
  outMessage: { fold: foldPlaygroundMenuOutMessage },
})

export const asyncCounterDemo = AsyncCounterDemo.block.connection({
  Model,
  field: 'asyncCounterDemo',
  parentMessage: Message.GotAsyncCounterDemoMessage,
})

export const notePlayerDemo = NotePlayerDemo.block.connection({
  Model,
  field: 'notePlayerDemo',
  parentMessage: Message.GotNotePlayerDemoMessage,
})
