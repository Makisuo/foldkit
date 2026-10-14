import { Option } from 'effect'

import { postDetails, posts, stats, tabs } from './childBindings'
import { ApplicationDefinition } from './definition'
import { Model, TABS_ID } from './model'
import { subscriptions } from './subscription'

export const ApplicationComposition = ApplicationDefinition.toComposition({
  children: [tabs, posts, stats, postDetails],
})
export const init = () => {
  const model = Model.make({
    tabs: tabs.init({ id: TABS_ID }).model,
    activeTab: 'Posts',
    posts: posts.init().model,
    postDetails: postDetails.init().model,
    maybeSelectedPostId: Option.none(),
    stats: stats.init().model,
  })
  return posts.revalidateOrLoad()(model)
}
export const EffectsLayer = subscriptions.statsRefreshTicks.layer
