import { Option } from 'effect'

import { init as initDragAndDrop } from '@foldkit/ui/dragAndDrop'

import { DEFAULT_COLUMNS } from './constant'
import { Application } from './definition'
import type { Flags } from './flags'

export const init = Application.init((flags: Flags) => {
  const columns = Option.match(flags.maybeSavedBoard, {
    onNone: () => DEFAULT_COLUMNS,
    onSome: ({ columns }) => columns,
  })

  return {
    model: {
      columns,
      dragAndDrop: initDragAndDrop({ id: 'kanban' }),
      maybeNewCardColumnId: Option.none(),
      newCardTitle: '',
      announcement: '',
    },
  }
})
