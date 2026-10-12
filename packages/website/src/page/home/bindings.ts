import { Option } from 'effect'
import { modifyFields } from 'foldkit/struct'

import * as AsyncCounterDemo from './asyncCounterDemo'
import { Message } from './message'
import { type Model } from './model'
import * as NotePlayerDemo from './notePlayerDemo'

export const asyncCounterDemo = AsyncCounterDemo.bind({
  placement: 'asyncCounterDemo',
  read: (model: Model) => Option.some(model.asyncCounterDemo),
  write: (model, nextAsyncCounterDemo) =>
    modifyFields(model, { asyncCounterDemo: () => nextAsyncCounterDemo }),
  toParentMessage: (message): Message =>
    Message.GotAsyncCounterDemoMessage({ message }),
})

export const notePlayerDemo = NotePlayerDemo.bind({
  placement: 'notePlayerDemo',
  read: (model: Model) => Option.some(model.notePlayerDemo),
  write: (model, nextNotePlayerDemo) =>
    modifyFields(model, { notePlayerDemo: () => nextNotePlayerDemo }),
  toParentMessage: (message): Message =>
    Message.GotNotePlayerDemoMessage({ message }),
})
