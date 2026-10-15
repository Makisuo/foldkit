import {
  asyncCounterDemo,
  demoTabs,
  notePlayerDemo,
  playgroundMenu,
} from './composition'
import { Home } from './definition'
import { Message } from './message'

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
