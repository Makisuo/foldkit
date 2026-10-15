import { Effect } from 'effect'
import { load } from 'foldkit/navigation'

import { Application } from '../definition'
import { Message } from '../message'
import { Model } from '../model'
import { Home } from '../page'
import { ExampleSlug } from '../page/example/meta'
import { playgroundRouter } from '../route'

export const LoadPlayground = Application.command('LoadPlayground', {
  args: { exampleSlug: ExampleSlug },
  messages: [Message.CompletedLoadPlayground],
  handler: function* () {
    return ({ exampleSlug }) =>
      load(playgroundRouter({ exampleSlug })).pipe(
        Effect.as(Message.CompletedLoadPlayground()),
      )
  },
})

const loadPlaygroundExample = (exampleSlug: ExampleSlug) => (model: Model) => ({
  model,
  commands: [LoadPlayground({ exampleSlug })],
})

const foldHomeOutMessage = Home.OutMessage.match({
  SelectedPlaygroundExample: ({ exampleSlug }) =>
    loadPlaygroundExample(exampleSlug),
})

export const home = Application.bindChild(Home.block, {
  field: 'maybeHome',
  parentMessage: Message.GotHomeMessage,
  outMessage: {
    fold: foldHomeOutMessage,
  },
})
