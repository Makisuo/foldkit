import { Option } from 'effect'

import { FocusUsernameInput } from './command'
import { Home } from './definition'
import { HomeStep, Model } from './model'

export const init = Home.init(() => ({
  model: Model.make({
    homeStep: HomeStep.EnterUsername({ username: '' }),
    formError: Option.none(),
  }),
  commands: [FocusUsernameInput()],
}))
