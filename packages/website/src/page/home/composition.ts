import { Tuple } from 'effect'
import type { Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { AsyncCounterDemoBlock } from './asyncCounterDemo'
import { HomeDefinition } from './definition'
import * as DemoTab from './demoTab'
import { OutMessage } from './message'
import { NotePlayerDemoBlock } from './notePlayerDemo'
import { PlaygroundMenuBlock } from './playgroundMenu'

const foldDemoTabsOutMessage = HomeDefinition.makeOutMessageFold(
  DemoTab.DemoTabsBlock,
  {
    Selected:
      ({ value }) =>
      model => ({
        model: modifyFields(model, { activeDemoTab: () => value }),
      }),
  },
)

export const DemoTabsBinding = HomeDefinition.bindChild(DemoTab.DemoTabsBlock, {
  field: 'demoTabs',
  outMessage: { fold: foldDemoTabsOutMessage },
  init: { contextToArgs: () => Tuple.make({ id: 'demo-tabs' }) },
})

const foldPlaygroundMenuOutMessage = HomeDefinition.makeOutMessageFold(
  PlaygroundMenuBlock,
  {
    Selected:
      ({ value }) =>
      model => ({
        model,
        outMessage: OutMessage.SelectedPlaygroundExample({
          exampleSlug: value,
        }),
      }),
    Closed: () => HomeDefinition.stepNoop(),
  },
)

export const PlaygroundMenuBinding = HomeDefinition.bindChild(
  PlaygroundMenuBlock,
  {
    field: 'playgroundMenu',
    outMessage: { fold: foldPlaygroundMenuOutMessage },
    init: {
      contextToArgs: () =>
        Tuple.make({ id: 'playground-menu', isAnimated: true }),
    },
  },
)

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
