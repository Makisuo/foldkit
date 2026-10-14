import { Runtime } from 'foldkit'

import {
  ApplicationDefinition,
  EffectsLayer,
  Flags,
  Message,
  init,
  update,
  view,
} from './application'
import './styles.css'

const application = ApplicationDefinition.make({
  init,
  update,
  view,
  EffectsLayer,
  Flags,
  container: document.getElementById('root'),
  devTools: { Message },
})

Runtime.hydrate(application)
