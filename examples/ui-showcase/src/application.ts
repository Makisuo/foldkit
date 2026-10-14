import { Effect, Layer, Schema } from 'effect'
import { load, pushUrl } from 'foldkit/navigation'
import { type Url } from 'foldkit/url'

import { ApplicationDefinition } from './definition'
import { Flags } from './flags'
import { Message } from './message'
import { Model } from './model'
import { urlToApplicationRoute } from './route'
import * as Ui from './ui'

export const ui = ApplicationDefinition.bindChild(Ui.block, {
  field: 'uiModel',
  parentMessage: Message.GotUiMessage,
})

export const ApplicationComposition = ApplicationDefinition.toComposition({
  children: [ui],
})

export const NavigateInternal = ApplicationComposition.command(
  'NavigateInternal',
  {
    args: { url: Schema.String },
    messages: [Message.CompletedNavigateInternal],
    handler: function* () {
      return ({ url }) =>
        pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal()))
    },
  },
)

export const LoadExternal = ApplicationComposition.command('LoadExternal', {
  args: { href: Schema.String },
  messages: [Message.CompletedLoadExternal],
  handler: function* () {
    return ({ href }) =>
      load(href).pipe(Effect.as(Message.CompletedLoadExternal()))
  },
})

export const init = (flags: Flags, url: Url) => {
  const uiInit = ui.init(flags.today)

  return {
    model: Model.make({
      route: urlToApplicationRoute(url),
      uiModel: uiInit.model,
    }),
    commands: uiInit.commands,
  }
}

export const EffectsLayer = Layer.merge(
  NavigateInternal.layer,
  LoadExternal.layer,
)
