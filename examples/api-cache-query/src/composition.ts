import { Match } from 'effect'
import { type Block, Update } from 'foldkit'

import { ApplicationDefinition } from './definition'
import { AppTabsBlock, TABS_ID, type Tab } from './model'
import { postQuery, postsQuery, statsQuery } from './query'

export const PostsBinding = ApplicationDefinition.bindChild(postsQuery, {
  field: 'posts',
})

export const StatsBinding = ApplicationDefinition.bindChild(statsQuery, {
  field: 'stats',
})

export const PostDetailsBinding = ApplicationDefinition.bindChild(postQuery, {
  field: 'postDetails',
})

const activateTab = (tab: typeof Tab.Type) => {
  const selectTab = ApplicationDefinition.stepFields(() => ({
    activeTab: () => tab,
  }))

  const loadTab = Match.value(tab).pipe(
    Match.when('Posts', () => PostsBinding.requestLoadIfMissing()),
    Match.when('Stats', () => StatsBinding.requestLoadIfMissing()),
    Match.exhaustive,
  )

  return ApplicationDefinition.step(() => Update.combine([selectTab, loadTab]))
}

export const TabsBinding = ApplicationDefinition.bindChild(AppTabsBlock, {
  field: 'tabs',
  init: { contextToArgs: () => [{ id: TABS_ID }] },
}).withOutMessagePolicy({
  fold: ApplicationDefinition.makeOutMessageFold(AppTabsBlock, {
    Selected: ({ value }) => activateTab(value),
  }),
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  bindings: [TabsBinding, PostsBinding, StatsBinding, PostDetailsBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
