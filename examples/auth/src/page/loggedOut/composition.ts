import { LoggedOut } from './definition'
import { Message, OutMessage } from './message'
import * as Login from './page/login'

export const LoginBinding = LoggedOut.bindChild(Login.block, {
  field: 'loginModel',
  parentMessage: Message.GotLoginMessage,
  init: true,
  outMessage: {
    forward: Login.OutMessage.match<OutMessage>({
      SucceededLogin: ({ session }) => OutMessage.SucceededLogin({ session }),
    }),
  },
})

export const LoggedOutComposition = LoggedOut.toComposition({
  childBindings: [LoginBinding],
})
