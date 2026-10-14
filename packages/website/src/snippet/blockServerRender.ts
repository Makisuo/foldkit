import { Server } from 'foldkit/experimental'

import { Application, init, update, view } from './blockProfile'

export const render = () =>
  Server.renderToString(Application, { init, update, view }, {})
