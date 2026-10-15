import { Option } from 'effect'
import { Update } from 'foldkit'
import type { Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Tabs } from '@foldkit/ui'

import { ExampleDetail } from './definition'
import { Message } from './message'
import { Model } from './model'
import { ObserveExampleUrlMessages } from './mount'

export const SourceFileTabs = Tabs.create()

const foldSourceFileTabsOutMessage = Tabs.OutMessage.match<
  Update.Step<Model, Message>
>({
  Selected:
    ({ value }) =>
    model => ({
      model: modifyFields(model, {
        maybeActiveSourceFilePath: () => Option.some(value),
      }),
    }),
})

export const sourceFileTabs = ExampleDetail.bindChild(SourceFileTabs, {
  field: 'sourceFileTabs',
  parentMessage: Message.GotSourceFileTabsMessage,
  outMessage: { fold: foldSourceFileTabsOutMessage },
})

export const mounts = [ObserveExampleUrlMessages]

export const ExampleDetailComposition = ExampleDetail.toComposition({
  children: [sourceFileTabs],
  mounts,
})
export type ExampleDetailViewBuilder = Block.HtmlBuilderOf<
  typeof ExampleDetailComposition
>
