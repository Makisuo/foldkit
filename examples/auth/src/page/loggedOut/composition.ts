import { LoggedOut } from './definition'
import { Message, OutMessage } from './message'
import * as Login from './page/login'

export const login = LoggedOut.bindChild(Login.block, {
  field: 'loginModel',
  parentMessage: Message.GotLoginMessage,
  outMessage: {
    forward: Login.OutMessage.match<OutMessage>({
      SucceededLogin: ({ session }) => OutMessage.SucceededLogin({ session }),
    }),
  },
})

export const LoggedOutComposition = LoggedOut.toComposition({
  children: [login],
})
