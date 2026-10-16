import { HashSet } from 'effect'

import { SnippetCopyComposition } from './definition'

export const init = SnippetCopyComposition.init(() => ({
  model: {
    copiedSnippetIds: HashSet.empty(),
  },
}))
