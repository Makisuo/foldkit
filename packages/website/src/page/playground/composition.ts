import { Tuple } from 'effect'
import type { Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { PlaygroundDefinition } from './definition'
import { PlaygroundFileTabsBlock } from './fileTabs'
import { MountPlaygroundEditor } from './mount'

const foldPlaygroundFileTabsOutMessage =
  PlaygroundDefinition.makeOutMessageFold(PlaygroundFileTabsBlock, {
    Selected:
      ({ value }) =>
      model => ({
        model: modifyFields(model, { activeFilePath: () => value }),
      }),
  })

export const FileTabsBinding = PlaygroundDefinition.bindChild(
  PlaygroundFileTabsBlock,
  {
    field: 'fileTabs',
    outMessage: { fold: foldPlaygroundFileTabsOutMessage },
    init: { contextToArgs: () => Tuple.make({ id: 'playground-files' }) },
  },
)

export const PlaygroundComposition = PlaygroundDefinition.makeComposition({
  mounts: [MountPlaygroundEditor],
  bindings: [FileTabsBinding],
})
export type PlaygroundViewBuilder = Block.ViewBuilderFor<
  typeof PlaygroundComposition
>
