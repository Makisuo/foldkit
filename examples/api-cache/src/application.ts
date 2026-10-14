import { HashMap, Layer, Option } from 'effect'

import { tabs } from './childBindings'
import { FetchPostDetail, FetchPosts, FetchStats } from './command'
import { ApplicationDefinition } from './definition'
import { AppTabs, Model, PostsData, StatsData, TABS_ID } from './model'
import { subscriptions } from './subscription'

export const ApplicationComposition = ApplicationDefinition.toComposition({
  children: [tabs],
})

export const init = () => ({
  model: Model.make({
    tabs: AppTabs.init({ id: TABS_ID }).model,
    activeTab: 'Posts',
    posts: PostsData.Loading(),
    postDetailById: HashMap.empty(),
    maybeSelectedPostId: Option.none(),
    stats: StatsData.Idle(),
  }),
  commands: [FetchPosts()],
})

export const EffectsLayer = Layer.mergeAll(
  FetchPosts.layer,
  FetchPostDetail.layer,
  FetchStats.layer,
  subscriptions.statsRevalidationTicks.layer,
)
