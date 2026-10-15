import { Option } from 'effect'

import { postDetails, posts, stats, tabs } from './composition'
import { Application } from './definition'
import { Model, TABS_ID } from './model'

export const init = Application.init(() => {
  const model = Model.make({
    tabs: tabs.init({ id: TABS_ID }).model,
    activeTab: 'Posts',
    posts: posts.init().model,
    postDetails: postDetails.init().model,
    maybeSelectedPostId: Option.none(),
    stats: stats.init().model,
  })

  return posts.revalidateOrLoad()(model)
})
