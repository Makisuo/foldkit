import { Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Tabs } from '@foldkit/ui'

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

export const sourceFileTabs = SourceFileTabs.connection({
  Model,
  field: 'sourceFileTabs',
  parentMessage: Message.GotSourceFileTabsMessage,
  outMessage: { fold: foldSourceFileTabsOutMessage },
})
