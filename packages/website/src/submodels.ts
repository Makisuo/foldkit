import { Effect, Option } from 'effect'
import { Command } from 'foldkit'
import { load } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'

import { Message } from './message'
import { type Model } from './model'
import { owner } from './owner'
import { Example, Home } from './page'
import { playgroundRouter } from './route'

export const LoadPlayground = Command.define(owner.name('LoadPlayground'), {
  args: { exampleSlug: Example.ExampleSlug },
  messages: [Message.CompletedLoadPlayground],
  handler: function* () {
    return ({ exampleSlug }) =>
      load(playgroundRouter({ exampleSlug })).pipe(
        Effect.as(Message.CompletedLoadPlayground()),
      )
  },
})

const loadPlaygroundExample =
  (exampleSlug: Example.ExampleSlug) => (model: Model) => ({
    model,
    commands: [LoadPlayground({ exampleSlug })],
  })

export const home = Home.bind({
  placement: 'home',
  read: (model: Model) => model.maybeHome,
  write: (model, nextHome) =>
    modifyFields(model, { maybeHome: () => Option.some(nextHome) }),
  toParentMessage: (message): Message => Message.GotHomeMessage({ message }),
  outMessage: {
    fold: Home.OutMessage.match({
      SelectedPlaygroundExample: ({ exampleSlug }) =>
        loadPlaygroundExample(exampleSlug),
    }),
  },
})
