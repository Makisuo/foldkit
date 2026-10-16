import { Application } from '../definition'
import { LoggedInBinding } from './loggedIn'
import { LoggedOutBinding } from './loggedOut'

export const ApplicationComposition = Application.toComposition({
  childBindings: [LoggedOutBinding, LoggedInBinding],
})
