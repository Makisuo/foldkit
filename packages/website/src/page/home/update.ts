import {
  asyncCounterDemo,
  demoTabs,
  notePlayerDemo,
  playgroundMenu,
} from './bindings'
import { Home } from './block'
import { Message } from './message'

// UPDATE

export const update = Home.update((model, message) =>
  Message.match(message, {
    GotDemoTabsMessage: ({ message }) => demoTabs.fold(model, message),
    GotPlaygroundMenuMessage: ({ message }) =>
      playgroundMenu.fold(model, message),
    GotAsyncCounterDemoMessage: ({ message }) =>
      asyncCounterDemo.fold(model, message),
    GotNotePlayerDemoMessage: ({ message }) =>
      notePlayerDemo.fold(model, message),
  }),
)
