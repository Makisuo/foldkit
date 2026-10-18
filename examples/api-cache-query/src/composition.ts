import { Match } from 'effect'
import { type Block, Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { ApplicationDefinition } from './definition'
import { Message } from './message'
import { AppTabs, TABS_ID, type Tab } from './model'
import { postQuery, postsQuery, statsQuery } from './query'

export const PostsBinding = ApplicationDefinition.bindChild(postsQuery, {
  field: 'posts',
  parentMessage: Message.GotPostsMessage,
})

export const StatsBinding = ApplicationDefinition.bindChild(statsQuery, {
  field: 'stats',
  parentMessage: Message.GotStatsMessage,
})

export const PostDetailsBinding = ApplicationDefinition.bindChild(postQuery, {
  field: 'postDetails',
  parentMessage: Message.GotPostMessage,
})

const activateTab = (tab: Tab) => {
  const selectTab = ApplicationDefinition.step(model => ({
    model: modifyFields(model, { activeTab: () => tab }),
  }))
  const loadTab = Match.value(tab).pipe(
    Match.when('Posts', () => PostsBinding.requestLoadIfMissing()),
    Match.when('Stats', () => StatsBinding.requestLoadIfMissing()),
    Match.exhaustive,
  )

  return Update.combine([selectTab, loadTab])
}

const foldTabsOutMessage = AppTabs.OutMessage.match({
  Selected: ({ value }) => activateTab(value),
})

export const TabsBinding = ApplicationDefinition.bindChild(AppTabs, {
  field: 'tabs',
  parentMessage: Message.GotTabsMessage,
  init: { startupToArgs: () => [{ id: TABS_ID }] },
  outMessage: { fold: foldTabsOutMessage },
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [TabsBinding, PostsBinding, StatsBinding, PostDetailsBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
