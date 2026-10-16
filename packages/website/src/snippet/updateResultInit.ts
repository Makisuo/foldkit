import { ApplicationComposition, HomeBinding } from './composition'

const init = ApplicationComposition.init(() =>
  HomeBinding.init({
    args: [],
    toParentModel: home => ({ home }),
  }),
)
