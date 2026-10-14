import { define as defineApplication } from 'foldkit/application'

const Model = Schema.Struct({
  posts: postsQuery.Model,
})
type Model = typeof Model.Type

const Message = defineMessageUnion({
  GotPostsMessage: { message: postsQuery.Message },
  ClickedRefreshPosts: {},
})
type Message = typeof Message.Type

const Application = defineApplication({ Model, Message })

const posts = Application.bindChild(postsQuery, {
  field: 'posts',
  parentMessage: Message.GotPostsMessage,
})

const ApplicationComposition = Application.toComposition({
  children: [posts],
})

const init = () => {
  const model = Model.make({ posts: posts.init().model })

  // Return the Loading Model state and the first FetchPosts Command.
  return posts.loadIfMissing()(model)
}

const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    // Run Query's update, then write its Model back into the parent.
    GotPostsMessage: ({ message }) => posts.fold(model, message),
    // Return the transition and Command for either missing or retained data.
    ClickedRefreshPosts: () => posts.revalidateOrLoad()(model),
  }),
)
