import { Tuple } from 'effect'
import type { Block } from 'foldkit'

import { PlaygroundDefinition } from './definition'
import { PlaygroundFileTabsBlock } from './fileTabs'
import { MountPlaygroundEditor } from './mount'

export const FileTabsBinding = PlaygroundDefinition.bindChild(
  PlaygroundFileTabsBlock,
  {
    field: 'fileTabs',
    init: { contextToArgs: () => Tuple.make({ id: 'playground-files' }) },
  },
).withOutMessagePolicy({
  fold: PlaygroundDefinition.makeOutMessageFold(PlaygroundFileTabsBlock, {
    Selected: ({ value }) =>
      PlaygroundDefinition.stepFields(() => ({ activeFilePath: () => value })),
  }),
})

export const PlaygroundComposition = PlaygroundDefinition.makeComposition({
  mounts: [MountPlaygroundEditor],
  bindings: [FileTabsBinding],
})
export type PlaygroundViewBuilder = Block.ViewBuilderFor<
  typeof PlaygroundComposition
>
