import { Runtime } from 'foldkit'

import { Application, init, update, view } from './application'

const element = Application.makeElement({
  init,
  update,
  view,
  container: document.getElementById('widget'),
})

Runtime.run(element)
