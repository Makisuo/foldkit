import { Tuple } from 'effect'
import type { Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  NoteDurationRadioGroupBlock,
  NotePlayerDemoDefinition,
} from './definition'
import { prependToLog } from './messageLog'

const foldNoteDurationRadioGroupOutMessage =
  NotePlayerDemoDefinition.makeOutMessageFold(NoteDurationRadioGroupBlock, {
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
  NoteDurationRadioGroupBlock,
  {
    field: 'noteDurationRadioGroup',
    outMessage: { fold: foldNoteDurationRadioGroupOutMessage },
    init: { contextToArgs: () => Tuple.make({ id: 'note-duration' }) },
  },
)

export const NotePlayerDemoComposition =
  NotePlayerDemoDefinition.makeComposition({
    bindings: [NoteDurationRadioGroupBinding],
  })
export type NotePlayerDemoViewBuilder = Block.ViewBuilderFor<
  typeof NotePlayerDemoComposition
>
