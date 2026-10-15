import { Runtime } from 'foldkit'

import { ApplicationComposition, init, update, view } from './application'

const element = ApplicationComposition.toElement({
  init,
  update,
  view,
  container: document.getElementById('widget'),
})

Runtime.run(element)
