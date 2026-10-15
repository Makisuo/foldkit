import { HashSet } from 'effect'

import { SnippetCopy } from './definition'

export const init = SnippetCopy.init(() => ({
  model: {
    copiedSnippetIds: HashSet.empty(),
  },
}))
