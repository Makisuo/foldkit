import { Option } from 'effect'
import { type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  EducationEntryDefinition,
  GraduationYearListbox,
  Message,
  type Model,
} from './definition'

const foldGraduationYearListboxOutMessage =
  GraduationYearListbox.OutMessage.match<Update.Step<Model, Message>>({
    Selected:
      ({ value }) =>
      model => ({
        model: modifyFields(model, {
          maybeGraduationYear: () => Option.some(value),
        }),
      }),
  })

export const GraduationYearListboxBinding = EducationEntryDefinition.bindChild(
  GraduationYearListbox,
  {
    field: 'graduationYearListbox',
    parentMessage: Message.GotGraduationYearListboxMessage,
    init: {
      args: entryId => [{ id: `${entryId}-graduation-year` }],
    },
    outMessage: { fold: foldGraduationYearListboxOutMessage },
  },
)

export const EducationEntryComposition =
  EducationEntryDefinition.makeComposition({
    childBindings: [GraduationYearListboxBinding],
  })
