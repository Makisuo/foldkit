import { HashMap, HashSet } from 'effect'

import { SnippetDisclosureComposition } from './composition'

export const init = SnippetDisclosureComposition.init(() => ({
  model: {
    openDisclosureIds: HashSet.empty(),
    snippetSizes: HashMap.empty(),
  },
}))
