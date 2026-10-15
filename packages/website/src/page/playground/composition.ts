import type { Block } from 'foldkit'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Tabs } from '@foldkit/ui'

import { Message, Model, Playground } from './definition'
import { MountPlaygroundEditor } from './mount'

const PlaygroundFileTabs = Tabs.create()

const foldPlaygroundFileTabsOutMessage = Tabs.OutMessage.match<
  Update.Step<Model, Message>
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { activeFilePath: () => value }),
    }),
})

export const fileTabs = Playground.bindChild(PlaygroundFileTabs, {
  field: 'fileTabs',
  parentMessage: Message.GotFileTabsMessage,
  outMessage: { fold: foldPlaygroundFileTabsOutMessage },
})

export const PlaygroundComposition = Playground.toComposition({
  mounts: [MountPlaygroundEditor],
  children: [fileTabs],
})
export type PlaygroundViewBuilder = Block.HtmlBuilderOf<
  typeof PlaygroundComposition
>
