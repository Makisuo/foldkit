import { Option } from 'effect'
import { modifyFields } from 'foldkit/struct'

import {
  EducationEntryDefinition,
  GraduationYearListboxBlock,
} from './definition'

const foldGraduationYearListboxOutMessage =
  EducationEntryDefinition.makeOutMessageFold(GraduationYearListboxBlock, {
    Selected:
      ({ value }) =>
      model => ({
        model: modifyFields(model, {
          maybeGraduationYear: () => Option.some(value),
        }),
      }),
  })

export const GraduationYearListboxBinding = EducationEntryDefinition.bindChild(
  GraduationYearListboxBlock,
  {
    field: 'graduationYearListbox',
    init: {
      contextToArgs: entryId => [{ id: `${entryId}-graduation-year` }],
    },
    outMessage: { fold: foldGraduationYearListboxOutMessage },
  },
)

export const EducationEntryComposition =
  EducationEntryDefinition.makeComposition({
    bindings: [GraduationYearListboxBinding],
  })
