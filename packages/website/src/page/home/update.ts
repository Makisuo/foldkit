import {
  asyncCounterDemo,
  demoTabs,
  notePlayerDemo,
  playgroundMenu,
} from './childBindings'
import { HomeDefinition } from './definition'
import { Message } from './message'

export const update = HomeDefinition.update((model, message) =>
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
