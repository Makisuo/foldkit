import { HashMap, Layer, Match, Option } from 'effect'
import { AsyncData, type Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { FetchPostDetail, FetchPosts, FetchStats } from './command'
import { Application } from './definition'
import { Message } from './message'
import {
  AppTabs,
  Model,
  PostsData,
  StatsData,
  TABS_ID,
  type Tab,
} from './model'
import { subscriptions } from './subscription'

export const applyPostsTransition = (
  model: Model,
  maybeNextPosts: Option.Option<PostsData>,
) =>
  Option.match(maybeNextPosts, {
    onNone: () => ({ model }),
    onSome: nextPosts => ({
      model: modifyFields(model, { posts: () => nextPosts }),
      commands: [FetchPosts()],
    }),
  })

export const applyStatsTransition = (
  model: Model,
  maybeNextStats: Option.Option<StatsData>,
) =>
  Option.match(maybeNextStats, {
    onNone: () => ({ model }),
    onSome: nextStats => ({
      model: modifyFields(model, { stats: () => nextStats }),
      commands: [FetchStats()],
    }),
  })

const activateTab = (model: Model, tab: Tab) => {
  const modelWithActiveTab = modifyFields(model, { activeTab: () => tab })

  return Match.value(tab).pipe(
    Match.when('Posts', () =>
      applyPostsTransition(
        modelWithActiveTab,
        AsyncData.loadIfMissing(modelWithActiveTab.posts),
      ),
    ),
    Match.when('Stats', () =>
      applyStatsTransition(
        modelWithActiveTab,
        AsyncData.loadIfMissing(modelWithActiveTab.stats),
      ),
    ),
    Match.exhaustive,
  )
}

const activateTabStep = (tab: Tab) =>
  Application.step(model => activateTab(model, tab))

const foldTabsOutMessage = AppTabs.OutMessage.match({
  Selected: ({ value }) => activateTabStep(value),
})

export const tabs = Application.bindChild(AppTabs, {
  field: 'tabs',
  parentMessage: Message.GotTabsMessage,
  outMessage: { fold: foldTabsOutMessage },
})

export const ApplicationComposition = Application.toComposition({
  children: [tabs],
})
export type ApplicationViewBuilder = Block.HtmlBuilderOf<
  typeof ApplicationComposition
>

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
