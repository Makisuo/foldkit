import { Match, Option } from 'effect'

import { RedirectToDashboard, SaveSession } from '../command'
import { ApplicationDefinition } from '../definition'
import { Message } from '../message'
import { LoggedIn, LoggedOut } from '../page'
import { ApplicationRoute } from '../route'

const foldLoggedOutOutMessage = LoggedOut.OutMessage.match({
  SucceededLogin: ({ session }) =>
    ApplicationDefinition.step(() => ({
      model: LoggedIn.init(ApplicationRoute.Dashboard(), session),
      commands: [SaveSession({ session }), RedirectToDashboard()],
    })),
})

export const LoggedOutBinding = ApplicationDefinition.bindChild(
  LoggedOut.block,
  {
    read: model =>
      Match.value(model).pipe(
        Match.tagsExhaustive({
          LoggedOut: loggedOutModel => Option.some(loggedOutModel),
          LoggedIn: () => Option.none(),
        }),
      ),
    write: (_model, nextLoggedOut) => nextLoggedOut,
    parentMessage: Message.GotLoggedOutMessage,
    fromParentMessage: {
      parentMessage: Message.GotLoggedOutMessage,
      args: (_model, { message }) => Option.some([message]),
    },
    outMessage: { fold: foldLoggedOutOutMessage },
  },
)
