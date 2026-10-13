import { Effect, Match, Option, Schema, pipe } from 'effect'
import { AsyncData } from 'foldkit'
import { define as defineApplication } from 'foldkit/application'
import { defineMessageUnion } from 'foldkit/message'
import { modifyFields } from 'foldkit/struct'

// MODEL

const Post = Schema.Struct({ id: Schema.String, title: Schema.String })

const PostsData = AsyncData.Schema(Schema.Array(Post), Schema.String)

const Model = Schema.Struct({
  posts: PostsData.schema,
})
type Model = typeof Model.Type

// MESSAGE

const Message = defineMessageUnion({
  EnteredPostsRoute: {},
  CompletedFetchPosts: {
    result: Schema.Result(Schema.Array(Post), Schema.String),
  },
})
type Message = typeof Message.Type

const Application = defineApplication({ Model, Message })

// COMMAND

const FetchPosts = Application.command('FetchPosts', {
  messages: [Message.CompletedFetchPosts],
  handler: function* () {
    return () =>
      pipe(
        fetchPosts,
        Effect.result,
        Effect.map(result => Message.CompletedFetchPosts({ result })),
      )
  },
})

// UPDATE

const update = Application.update((model, message) =>
  Match.value(message).pipe(
    Match.tagsExhaustive({
      EnteredPostsRoute: () =>
        Option.match(AsyncData.revalidateOrLoad(model.posts), {
          onNone: () => ({ model }),
          onSome: nextPosts => ({
            model: modifyFields(model, { posts: () => nextPosts }),
            commands: [FetchPosts()],
          }),
        }),

      CompletedFetchPosts: ({ result }) => ({
        model: modifyFields(model, { posts: AsyncData.settle(result) }),
      }),
    }),
  ),
)
