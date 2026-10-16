import { Option } from 'effect'

import { FocusUsernameInput } from './command'
import { HomeComposition } from './definition'
import { HomeStep, Model } from './model'

export const init = HomeComposition.init(() => ({
  model: Model.make({
    homeStep: HomeStep.EnterUsername({ username: '' }),
    formError: Option.none(),
  }),
  commands: [FocusUsernameInput()],
}))
