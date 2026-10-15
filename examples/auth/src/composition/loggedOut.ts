import { Match, Option } from 'effect'

import { RedirectToDashboard, SaveSession } from '../command'
import { Application } from '../definition'
import { Message } from '../message'
import { LoggedIn, LoggedOut } from '../page'
import { ApplicationRoute } from '../route'

const foldLoggedOutOutMessage = LoggedOut.OutMessage.match({
  SucceededLogin: ({ session }) =>
    Application.step(() => ({
      model: LoggedIn.init(ApplicationRoute.Dashboard(), session),
      commands: [SaveSession({ session }), RedirectToDashboard()],
    })),
})

export const loggedOut = Application.bindChild(LoggedOut.block, {
  read: model =>
    Match.value(model).pipe(
      Match.tagsExhaustive({
        LoggedOut: loggedOutModel => Option.some(loggedOutModel),
        LoggedIn: () => Option.none(),
      }),
    ),
  write: (_model, nextLoggedOut) => nextLoggedOut,
  parentMessage: Message.GotLoggedOutMessage,
  outMessage: { fold: foldLoggedOutOutMessage },
})
