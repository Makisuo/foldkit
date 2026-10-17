import { Match, Option } from 'effect'

import { ClearSession, RedirectToHome } from '../command'
import { ApplicationDefinition } from '../definition'
import { Message } from '../message'
import { LoggedIn, LoggedOut } from '../page'
import { ApplicationRoute } from '../route'

const foldLoggedInOutMessage = LoggedIn.OutMessage.match({
  RequestedLogout: () =>
    ApplicationDefinition.step(() => ({
      model: LoggedOut.init(ApplicationRoute.Home()),
      commands: [ClearSession(), RedirectToHome()],
    })),
})

export const LoggedInBinding = ApplicationDefinition.bindChild(LoggedIn.block, {
  read: model =>
    Match.value(model).pipe(
      Match.tagsExhaustive({
        LoggedOut: () => Option.none(),
        LoggedIn: loggedInModel => Option.some(loggedInModel),
      }),
    ),
  write: (_model, nextLoggedIn) => nextLoggedIn,
  parentMessage: Message.GotLoggedInMessage,
  fromParentMessage: {
    parentMessage: Message.GotLoggedInMessage,
    args: (_model, { message }) => Option.some([message]),
  },
  outMessage: { fold: foldLoggedInOutMessage },
})
