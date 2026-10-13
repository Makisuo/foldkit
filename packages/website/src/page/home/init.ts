import {
  asyncCounterDemo,
  demoTabs,
  notePlayerDemo,
  playgroundMenu,
} from './bindings'
import * as DemoTab from './demoTab'
import { Model } from './model'

// INIT

export const init = () => {
  const activeDemoTab: DemoTab.Tab = 'Architecture'
  const asyncCounterDemoInit = asyncCounterDemo.init()
  const notePlayerDemoInit = notePlayerDemo.init()
  const demoTabsInit = demoTabs.init({ id: 'demo-tabs' })
  const playgroundMenuInit = playgroundMenu.init({
    id: 'playground-menu',
    isAnimated: true,
  })

  const model = Model.make({
    demoTabs: demoTabsInit.model,
    activeDemoTab,
    playgroundMenu: playgroundMenuInit.model,
    asyncCounterDemo: asyncCounterDemoInit.model,
    notePlayerDemo: notePlayerDemoInit.model,
  })

  return {
    model,
    commands: [
      ...(asyncCounterDemoInit.commands ?? []),
      ...(notePlayerDemoInit.commands ?? []),
      ...(demoTabsInit.commands ?? []),
      ...(playgroundMenuInit.commands ?? []),
    ],
  }
}
