import { Match } from 'effect'

import { notFoundView } from '../../notFoundView'
import { homeRouter } from '../../route'
import { LoggedOutComposition, login } from './definition'
import * as Home from './page/home'

export const view = LoggedOutComposition.view((model, h) =>
  h.div(
    [h.Class('py-8')],
    [
      Match.value(model.route).pipe(
        Match.tagsExhaustive({
          Home: () => Home.view(h),
          Login: () =>
            h.block(
              login.embedView({
                slotId: 'login',
                model: model.loginModel,
              }),
            ),
          NotFound: ({ path }) =>
            notFoundView(path, homeRouter(), 'Go Home', h),
        }),
      ),
    ],
  ),
)
