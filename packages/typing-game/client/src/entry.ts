import { pipe } from 'effect'
import { Application, Runtime } from 'foldkit'

import { AppLayer } from './layer'
import { Message } from './message'
import { Model } from './model'
import {
  init,
  managedResources,
  mounts,
  subscriptions,
  update,
} from './submodel'
import { view } from './view'

const application = Application.make({
  Model,
  init,
  update,
  view,
  subscriptions,
  managedResources,
  mounts,
  container: document.getElementById('root'),
  devTools: {
    Message,
    mode: 'TimeTravel',
  },
  routing: {
    onUrlRequest: request => Message.ClickedLink({ request }),
    onUrlChange: url => Message.ChangedUrl({ url }),
  },
})

pipe(application, Application.provide(AppLayer), Runtime.run)
