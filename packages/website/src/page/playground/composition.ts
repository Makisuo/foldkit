import { Tuple } from 'effect'
import type { Block } from 'foldkit'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Tabs } from '@foldkit/ui'

import { Message, Model, PlaygroundDefinition } from './definition'
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

export const FileTabsBinding = PlaygroundDefinition.bindChild(
  PlaygroundFileTabs,
  {
    field: 'fileTabs',
    parentMessage: Message.GotFileTabsMessage,
    outMessage: { fold: foldPlaygroundFileTabsOutMessage },
    init: { args: () => Tuple.make({ id: 'playground-files' }) },
  },
)

export const PlaygroundComposition = PlaygroundDefinition.makeComposition({
  mounts: [MountPlaygroundEditor],
  childBindings: [FileTabsBinding],
})
export type PlaygroundViewBuilder = Block.ViewBuilderFor<
  typeof PlaygroundComposition
>
