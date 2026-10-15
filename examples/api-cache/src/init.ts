import { HashMap, Option } from 'effect'

import { FetchPosts } from './command'
import { Application } from './definition'
import { AppTabs, Model, PostsData, StatsData, TABS_ID } from './model'

export const init = Application.init(() => ({
  model: Model.make({
    tabs: AppTabs.init({ id: TABS_ID }).model,
    activeTab: 'Posts',
    posts: PostsData.Loading(),
    postDetailById: HashMap.empty(),
    maybeSelectedPostId: Option.none(),
    stats: StatsData.Idle(),
  }),
  commands: [FetchPosts()],
}))
