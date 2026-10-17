import { LoggedOutDefinition } from './definition'
import { Message, OutMessage } from './message'
import * as Login from './page/login'

export const LoginBinding = LoggedOutDefinition.bindChild(Login.block, {
  field: 'loginModel',
  parentMessage: Message.GotLoginMessage,
  outMessage: {
    forward: Login.OutMessage.match<OutMessage>({
      SucceededLogin: ({ session }) => OutMessage.SucceededLogin({ session }),
    }),
  },
})

export const LoggedOutComposition = LoggedOutDefinition.makeComposition({
  childBindings: [LoginBinding],
})
