import { Match } from 'effect'
import type { Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Application } from './definition'
import { Message } from './message'
import { AppTabs, TABS_ID, type Tab } from './model'
import { postQuery, postsQuery, statsQuery } from './query'

export const PostsBinding = Application.bindChild(postsQuery, {
  field: 'posts',
  parentMessage: Message.GotPostsMessage,
})

export const StatsBinding = Application.bindChild(statsQuery, {
  field: 'stats',
  parentMessage: Message.GotStatsMessage,
})

export const PostDetailsBinding = Application.bindChild(postQuery, {
  field: 'postDetails',
  parentMessage: Message.GotPostMessage,
})

const activateTab = (tab: Tab) =>
  Application.step(model => {
    const modelWithActiveTab = modifyFields(model, { activeTab: () => tab })

    return Match.value(tab).pipe(
      Match.when('Posts', () =>
        PostsBinding.loadIfMissing()(modelWithActiveTab),
      ),
      Match.when('Stats', () =>
        StatsBinding.loadIfMissing()(modelWithActiveTab),
      ),
      Match.exhaustive,
    )
  })

const foldTabsOutMessage = AppTabs.OutMessage.match({
  Selected: ({ value }) => activateTab(value),
})

export const TabsBinding = Application.bindChild(AppTabs, {
  field: 'tabs',
  parentMessage: Message.GotTabsMessage,
  init: { args: () => [{ id: TABS_ID }] },
  outMessage: { fold: foldTabsOutMessage },
})

export const ApplicationComposition = Application.toComposition({
  childBindings: [TabsBinding, PostsBinding, StatsBinding, PostDetailsBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
