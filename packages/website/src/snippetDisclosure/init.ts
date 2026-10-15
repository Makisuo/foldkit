import { HashMap, HashSet } from 'effect'

import { SnippetDisclosure } from './definition'

export const init = SnippetDisclosure.init(() => ({
  model: {
    openDisclosureIds: HashSet.empty(),
    snippetSizes: HashMap.empty(),
  },
}))
