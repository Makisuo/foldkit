import { Effect, Option } from 'effect'
import { load } from 'foldkit/navigation'

import { Application } from '../definition'
import { Message } from '../message'
import { Home } from '../page'
import { ExampleSlug } from '../page/example/meta'
import { playgroundRouter } from '../route'
import { type Startup } from '../startup'

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

const loadPlaygroundExample = (exampleSlug: ExampleSlug) =>
  Application.step(model => ({
    model,
    commands: [LoadPlayground({ exampleSlug })],
  }))

const foldHomeOutMessage = Home.OutMessage.match({
  SelectedPlaygroundExample: ({ exampleSlug }) =>
    loadPlaygroundExample(exampleSlug),
})

export const HomeBinding = Application.bindChild(Home.block, {
  field: 'maybeHome',
  init: {
    args: ({ route }: Startup) =>
      route._tag === 'Home' ? Option.some([]) : Option.none(),
  },
  parentMessage: Message.GotHomeMessage,
  outMessage: {
    fold: foldHomeOutMessage,
  },
})
