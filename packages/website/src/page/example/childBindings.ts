import { Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Tabs } from '@foldkit/ui'

import { ExampleDetailDefinition } from './definition'
import { Message } from './message'
import { Model } from './model'

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

export const sourceFileTabs = ExampleDetailDefinition.bindChild(
  SourceFileTabs,
  {
    field: 'sourceFileTabs',
    parentMessage: Message.GotSourceFileTabsMessage,
    outMessage: { fold: foldSourceFileTabsOutMessage },
  },
)
