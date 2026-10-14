import { Match, Option } from 'effect'

import {
  ClearSession,
  RedirectToDashboard,
  RedirectToHome,
  SaveSession,
} from './command'
import { ApplicationDefinition } from './definition'
import { Message } from './message'
import { Model } from './model'
import { LoggedIn, LoggedOut } from './page'
import { ApplicationRoute } from './route'

const foldLoggedOutOutMessage = LoggedOut.OutMessage.match({
  SucceededLogin: ({ session }) =>
    ApplicationDefinition.step(() => ({
      model: LoggedIn.init(ApplicationRoute.Dashboard(), session),
      commands: [SaveSession({ session }), RedirectToDashboard()],
    })),
})

export const loggedOut = ApplicationDefinition.bindChild(LoggedOut.block, {
  read: (model: Model) =>
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

const foldLoggedInOutMessage = LoggedIn.OutMessage.match({
  RequestedLogout: () =>
    ApplicationDefinition.step(() => ({
      model: LoggedOut.init(ApplicationRoute.Home()),
      commands: [ClearSession(), RedirectToHome()],
    })),
})

export const loggedIn = ApplicationDefinition.bindChild(LoggedIn.block, {
  read: (model: Model) =>
    Match.value(model).pipe(
      Match.tagsExhaustive({
        LoggedOut: () => Option.none(),
        LoggedIn: loggedInModel => Option.some(loggedInModel),
      }),
    ),
  write: (_model, nextLoggedIn) => nextLoggedIn,
  parentMessage: Message.GotLoggedInMessage,
  outMessage: { fold: foldLoggedInOutMessage },
})
