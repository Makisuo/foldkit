import { Application } from '../definition'
import * as LoggedIn from './loggedIn'
import * as LoggedOut from './loggedOut'

export const ApplicationComposition = Application.toComposition({
  children: [LoggedOut.loggedOut, LoggedIn.loggedIn],
})
