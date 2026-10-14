import { HashMap, Option } from 'effect'
import { AsyncData } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  applyPostsTransition,
  applyStatsTransition,
  tabs,
} from './childBindings'
import { FetchPostDetail } from './command'
import { Application } from './definition'
import { Message } from './message'
import { PostDetailData } from './model'

const setPostDetail = (postId: string, postDetail: PostDetailData) =>
  HashMap.set(postId, postDetail)

export const update = Application.update((model, message) =>
  Message.match(message, {
    GotTabsMessage: ({ message }) => tabs.fold(model, message),

    ClickedPost: ({ postId }) => {
      const selectedModel = modifyFields(model, {
        maybeSelectedPostId: () => Option.some(postId),
      })

      return Option.match(HashMap.get(model.postDetailById, postId), {
        onNone: () => ({
          model: modifyFields(selectedModel, {
            postDetailById: setPostDetail(postId, PostDetailData.Loading()),
          }),
          commands: [FetchPostDetail({ postId })],
        }),
        onSome: () => ({ model: selectedModel }),
      })
    },

    ClickedBackToPosts: () => ({
      model: modifyFields(model, { maybeSelectedPostId: () => Option.none() }),
    }),

    ClickedInvalidatePosts: () =>
      applyPostsTransition(model, AsyncData.revalidateOrLoad(model.posts)),

    ClickedRetryPosts: () =>
      applyPostsTransition(model, AsyncData.revalidateOrLoad(model.posts)),

    ClickedRetryPostDetail: ({ postId }) => ({
      model: modifyFields(model, {
        postDetailById: setPostDetail(postId, PostDetailData.Loading()),
      }),
      commands: [FetchPostDetail({ postId })],
    }),

    ClickedRefreshStats: () =>
      applyStatsTransition(model, AsyncData.revalidateOrLoad(model.stats)),

    ClickedRetryStats: () =>
      applyStatsTransition(model, AsyncData.revalidateOrLoad(model.stats)),

    TickedRevalidateStats: () =>
      applyStatsTransition(model, AsyncData.revalidate(model.stats)),

    CompletedFetchPosts: ({ result }) => ({
      model: modifyFields(model, { posts: AsyncData.settle(result) }),
    }),

    CompletedFetchPostDetail: ({ postId, result }) => ({
      model: modifyFields(model, {
        postDetailById: HashMap.modify(postId, AsyncData.settle(result)),
      }),
    }),

    CompletedFetchStats: ({ result }) => ({
      model: modifyFields(model, { stats: AsyncData.settle(result) }),
    }),
  }),
)
