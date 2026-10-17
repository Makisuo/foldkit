import { modifyFields } from 'foldkit/struct'

import { SearchDefinition } from './definition'
import { SearchState } from './model'

export const clearSearchQuery = SearchDefinition.step(model => ({
  model: modifyFields(model, {
    query: () => '',
    searchState: () => SearchState.Idle(),
    activeResultIndex: () => -1,
  }),
}))
