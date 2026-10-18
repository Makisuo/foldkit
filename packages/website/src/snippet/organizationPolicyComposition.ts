import * as Counter from '../../counter'
import { EditorDefinition } from '../definition'
import { Message } from '../message'
import { FocusEditor } from '../mount'
import { DialogBinding } from './dialog'

export const CounterBinding = EditorDefinition.bindChild(Counter.block, {
  field: 'counter',
  parentMessage: Message.GotCounterMessage,
})

export const EditorComposition = EditorDefinition.makeComposition({
  childBindings: [CounterBinding, DialogBinding],
  mounts: [FocusEditor],
})
