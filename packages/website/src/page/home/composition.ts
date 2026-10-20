import { Tuple } from 'effect'
import type { Block } from 'foldkit'

import { AsyncCounterDemoBlock } from './asyncCounterDemo'
import { HomeDefinition } from './definition'
import * as DemoTab from './demoTab'
import { OutMessage } from './message'
import { NotePlayerDemoBlock } from './notePlayerDemo'
import { PlaygroundMenuBlock } from './playgroundMenu'

export const DemoTabsBinding = HomeDefinition.bindChild(DemoTab.DemoTabsBlock, {
  field: 'demoTabs',
  init: { contextToArgs: () => Tuple.make({ id: 'demo-tabs' }) },
}).withOutMessagePolicy({
  fold: HomeDefinition.makeOutMessageFold(DemoTab.DemoTabsBlock, {
    Selected: ({ value }) =>
      HomeDefinition.stepFields(() => ({ activeDemoTab: () => value })),
  }),
})

const foldPlaygroundMenuOutMessage = HomeDefinition.makeOutMessageFold(
  PlaygroundMenuBlock,
  {
    Selected: ({ value }) =>
      HomeDefinition.step(model => ({
        model,
        outMessage: OutMessage.SelectedPlaygroundExample({
          exampleSlug: value,
        }),
      })),
    Closed: HomeDefinition.stepNoop,
  },
)

export const PlaygroundMenuBinding = HomeDefinition.bindChild(
  PlaygroundMenuBlock,
  {
    field: 'playgroundMenu',
    init: {
      contextToArgs: () =>
        Tuple.make({ id: 'playground-menu', isAnimated: true }),
    },
  },
).withOutMessagePolicy({ fold: foldPlaygroundMenuOutMessage })

export const AsyncCounterDemoBinding = HomeDefinition.bindChild(
  AsyncCounterDemoBlock,
  {
    field: 'asyncCounterDemo',
  },
)

export const NotePlayerDemoBinding = HomeDefinition.bindChild(
  NotePlayerDemoBlock,
  {
    field: 'notePlayerDemo',
  },
)

export const HomeComposition = HomeDefinition.makeComposition({
  bindings: [
    AsyncCounterDemoBinding,
    DemoTabsBinding,
    NotePlayerDemoBinding,
    PlaygroundMenuBinding,
  ],
})
export type HomeViewBuilder = Block.ViewBuilderFor<typeof HomeComposition>
