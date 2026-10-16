import * as Counter from '../../counter'
import { Editor } from '../definition'
import { Message } from '../message'
import { FocusEditor } from '../mount'
import * as Dialog from './dialog'

export const CounterBinding = Editor.bindChild(Counter.block, {
  field: 'counter',
  parentMessage: Message.GotCounterMessage,
})

export const EditorComposition = Editor.toComposition({
  childBindings: [CounterBinding, Dialog.DialogBinding],
  mounts: [FocusEditor],
})
