import { dialog } from './childBindings'
import { Model, SearchState } from './model'

export const init = () => {
  const dialogInit = dialog.init({ id: 'search-dialog' })

  return {
    model: Model.make({
      dialog: dialogInit.model,
      query: '',
      searchState: SearchState.Idle(),
      activeResultIndex: -1,
    }),
    commands: dialogInit.commands,
  }
}
