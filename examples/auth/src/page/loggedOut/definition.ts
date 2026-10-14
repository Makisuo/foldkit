import { Option } from 'effect'
import { Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Message, OutMessage } from './message'
import { Model } from './model'
import * as Login from './page/login'

export const LoggedOut = Block.define('LoggedOut', {
  Model,
  Message,
  OutMessage,
})

export const login = LoggedOut.bindChild(Login.block, {
  read: (model: Model) => Option.some(model.loginModel),
  write: (model, nextLoginModel) =>
    modifyFields(model, { loginModel: () => nextLoginModel }),
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
