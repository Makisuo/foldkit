import { Option } from 'effect'

import { ApplicationComposition, PostsBinding } from './composition'

export const init = ApplicationComposition.init(() => ({
  model: {
    activeTab: 'Posts',
    maybeSelectedPostId: Option.none(),
  },
  steps: [PostsBinding.revalidateOrLoad()],
}))
