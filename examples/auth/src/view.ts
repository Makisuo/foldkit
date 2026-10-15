import { Match } from 'effect'

import { ApplicationComposition } from './application'
import { loggedIn } from './composition/loggedIn'
import { loggedOut } from './composition/loggedOut'
import { Model } from './model'

const title = (model: Model): string =>
  Match.value(model.route).pipe(
    Match.tag('Home', () => 'Auth'),
    Match.orElse(({ _tag }) => `${_tag} | Auth`),
  )

export const view = ApplicationComposition.view((model, h) => ({
  title: title(model),
  body: h.div(
    [h.Class('min-h-screen bg-gray-100')],
    [
      Match.value(model).pipe(
        Match.tagsExhaustive({
          LoggedOut: loggedOutModel =>
            h.block(
              loggedOut.embedView({
                slotId: 'logged-out',
                model: loggedOutModel,
              }),
            ),
          LoggedIn: loggedInModel =>
            h.block(
              loggedIn.embedView({
                slotId: 'logged-in',
                model: loggedInModel,
              }),
            ),
        }),
      ),
    ],
  ),
}))
