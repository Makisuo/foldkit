import { Tuple } from 'effect'
import type { Block } from 'foldkit'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  Message,
  Model,
  NoteDurationRadioGroup,
  NotePlayerDemoDefinition,
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

export const NoteDurationRadioGroupBinding = NotePlayerDemoDefinition.bindChild(
  NoteDurationRadioGroup,
  {
    field: 'noteDurationRadioGroup',
    parentMessage: Message.GotNoteDurationMessage,
    outMessage: { fold: foldNoteDurationRadioGroupOutMessage },
    init: { args: () => Tuple.make({ id: 'note-duration' }) },
  },
)

export const NotePlayerDemoComposition =
  NotePlayerDemoDefinition.makeComposition({
    childBindings: [NoteDurationRadioGroupBinding],
  })
export type NotePlayerDemoViewBuilder = Block.ViewBuilderFor<
  typeof NotePlayerDemoComposition
>
