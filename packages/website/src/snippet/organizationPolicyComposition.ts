import * as Counter from '../../counter'
import { Editor } from '../definition'
import { Message } from '../message'
import { FocusEditor } from '../mount'
import { dialog } from './dialog'

export { dialog } from './dialog'

export const counter = Editor.bindChild(Counter.block, {
  field: 'counter',
  parentMessage: Message.GotCounterMessage,
})

export const EditorComposition = Editor.toComposition({
  children: [counter, dialog],
  mounts: [FocusEditor],
})
