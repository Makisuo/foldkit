import { dialog } from './composition'
import { Search } from './definition'
import { Model, SearchState } from './model'

export const init = Search.init(() => {
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
})
