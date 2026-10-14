import { Match } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { ApplicationDefinition } from './definition'
import { Message } from './message'
import { AppTabs, type Tab } from './model'
import { postQuery, postsQuery, statsQuery } from './query'

export const posts = ApplicationDefinition.bindChild(postsQuery, {
  field: 'posts',
  parentMessage: Message.GotPostsMessage,
})
export const stats = ApplicationDefinition.bindChild(statsQuery, {
  field: 'stats',
  parentMessage: Message.GotStatsMessage,
})
export const postDetails = ApplicationDefinition.bindChild(postQuery, {
  field: 'postDetails',
  parentMessage: Message.GotPostMessage,
})

const activateTab = (tab: Tab) =>
  ApplicationDefinition.step(model => {
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
export const tabs = ApplicationDefinition.bindChild(AppTabs, {
  field: 'tabs',
  parentMessage: Message.GotTabsMessage,
  outMessage: { fold: foldTabsOutMessage },
})
