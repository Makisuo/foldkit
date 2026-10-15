import type { Block } from 'foldkit'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  Message,
  Model,
  NoteDurationRadioGroup,
  NotePlayerDemo,
} from './definition'
import { prependToLog } from './messageLog'

const foldNoteDurationRadioGroupOutMessage =
  NoteDurationRadioGroup.OutMessage.match<
    Update.Step<Model, Message>,
    typeof NoteDurationRadioGroup.OutMessage.Type
  >({
    Selected:
      ({ value }) =>
      model => ({
        model: modifyFields(model, {
          noteDuration: () => value,
          messageLog: prependToLog(`Selected(${value})`),
        }),
      }),
  })

export const noteDurationRadioGroup = NotePlayerDemo.bindChild(
  NoteDurationRadioGroup,
  {
    field: 'noteDurationRadioGroup',
    parentMessage: Message.GotNoteDurationMessage,
    outMessage: { fold: foldNoteDurationRadioGroupOutMessage },
  },
)

export const NotePlayerDemoComposition = NotePlayerDemo.toComposition({
  children: [noteDurationRadioGroup],
})
export type NotePlayerDemoViewBuilder = Block.HtmlBuilderOf<
  typeof NotePlayerDemoComposition
>
