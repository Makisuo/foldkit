import { Match, Option } from 'effect'
import type { Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Application } from './definition'
import { Message } from './message'
import { AppTabs, Model, TABS_ID, type Tab } from './model'
import { postQuery, postsQuery, statsQuery } from './query'
import { subscriptions } from './subscription'

export const posts = Application.bindChild(postsQuery, {
  field: 'posts',
  parentMessage: Message.GotPostsMessage,
})

export const stats = Application.bindChild(statsQuery, {
  field: 'stats',
  parentMessage: Message.GotStatsMessage,
})

export const postDetails = Application.bindChild(postQuery, {
  field: 'postDetails',
  parentMessage: Message.GotPostMessage,
})

const activateTab = (tab: Tab) =>
  Application.step(model => {
    const modelWithActiveTab = modifyFields(model, { activeTab: () => tab })

    return Match.value(tab).pipe(
      Match.when('Posts', () => posts.loadIfMissing()(modelWithActiveTab)),
      Match.when('Stats', () => stats.loadIfMissing()(modelWithActiveTab)),
      Match.exhaustive,
    )
  })

const foldTabsOutMessage = AppTabs.OutMessage.match({
  Selected: ({ value }) => activateTab(value),
})

export const tabs = Application.bindChild(AppTabs, {
  field: 'tabs',
  parentMessage: Message.GotTabsMessage,
  outMessage: { fold: foldTabsOutMessage },
})

export const ApplicationComposition = Application.toComposition({
  children: [tabs, posts, stats, postDetails],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>

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

export const EffectsLayer = subscriptions.statsRefreshTicks.layer
