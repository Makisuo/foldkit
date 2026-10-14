import { Runtime } from 'foldkit'

import { ApplicationDefinition, init, update, view } from './application'

const element = ApplicationDefinition.makeElement({
  init,
  update,
  view,
  container: document.getElementById('widget'),
})

Runtime.run(element)
