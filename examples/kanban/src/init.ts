import { Option } from 'effect'

import { ApplicationComposition } from './composition'
import { DEFAULT_COLUMNS } from './constant'
import type { Flags } from './flags'

export const init = ApplicationComposition.init((flags: Flags) => {
  const columns = Option.match(flags.maybeSavedBoard, {
    onNone: () => DEFAULT_COLUMNS,
    onSome: ({ columns }) => columns,
  })

  return {
    model: {
      columns,
      maybeNewCardColumnId: Option.none(),
      newCardTitle: '',
      announcement: '',
    },
  }
})
