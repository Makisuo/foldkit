import { Option } from 'effect'

import { Application } from './definition'
import type { Flags } from './flags'
import { EditingState, Model } from './model'

export const init = Application.init((flags: Flags) => ({
  model: Model.make({
    todos: Option.getOrElse(flags.todos, () => []),
    newTodoText: '',
    filter: 'All',
    editing: EditingState.NotEditing(),
  }),
}))
