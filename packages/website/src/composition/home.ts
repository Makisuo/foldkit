import { Effect, Option } from 'effect'
import { load } from 'foldkit/navigation'

import { ApplicationDefinition } from '../definition'
import { Message } from '../message'
import { Home } from '../page'
import { ExampleSlug } from '../page/example/meta'
import { playgroundRouter } from '../route'

export const LoadPlayground = ApplicationDefinition.command('LoadPlayground', {
  args: { exampleSlug: ExampleSlug },
  messages: [Message.CompletedLoadPlayground],
  handler: function* () {
    return ({ exampleSlug }) =>
      load(playgroundRouter({ exampleSlug })).pipe(
        Effect.as(Message.CompletedLoadPlayground()),
      )
  },
})

const loadPlaygroundExample = (exampleSlug: ExampleSlug) =>
  ApplicationDefinition.step(model => ({
    model,
    commands: [LoadPlayground({ exampleSlug })],
  }))

const foldHomeOutMessage = Home.OutMessage.match({
  SelectedPlaygroundExample: ({ exampleSlug }) =>
    loadPlaygroundExample(exampleSlug),
})

export const HomeBinding = ApplicationDefinition.bindChild(Home.block, {
  field: 'maybeHome',
  init: {
    args: ({ route }) =>
      route._tag === 'Home' ? Option.some([]) : Option.none(),
  },
  parentMessage: Message.GotHomeMessage,
  outMessage: {
    fold: foldHomeOutMessage,
  },
})
