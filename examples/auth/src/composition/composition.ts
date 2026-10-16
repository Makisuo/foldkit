import { Application } from '../definition'
import * as LoggedIn from './loggedIn'
import * as LoggedOut from './loggedOut'

export const ApplicationComposition = Application.toComposition({
  childBindings: [LoggedOut.LoggedOutBinding, LoggedIn.LoggedInBinding],
})
