import { Option } from 'effect'
import { modifyFields } from 'foldkit/struct'

import { postDetails, posts, stats, tabs } from './composition'
import { Application } from './definition'
import { Message } from './message'

export const update = Application.update((model, message) =>
  Message.match(message, {
    GotTabsMessage: ({ message }) => tabs.fold(model, message),
    GotPostsMessage: ({ message }) => posts.fold(model, message),
    GotStatsMessage: ({ message }) => stats.fold(model, message),
    GotPostMessage: ({ message }) => postDetails.fold(model, message),

    ClickedPost: ({ postId }) =>
      postDetails.loadIfMissing({ postId })(
        modifyFields(model, {
          maybeSelectedPostId: () => Option.some(postId),
        }),
      ),

    ClickedBackToPosts: () => ({
      model: modifyFields(model, { maybeSelectedPostId: () => Option.none() }),
    }),

    ClickedRefreshPosts: () => posts.revalidateOrLoad()(model),
    ClickedRetryPosts: () => posts.revalidateOrLoad()(model),

    ClickedRetryPost: ({ postId }) =>
      postDetails.revalidateOrLoad({ postId })(model),

    ClickedRefreshStats: () => stats.revalidateOrLoad()(model),
    ClickedRetryStats: () => stats.revalidateOrLoad()(model),
    TickedStatsRefreshInterval: () => stats.revalidate()(model),
  }),
)
