import { Server } from 'foldkit/experimental'

import { implementation, registered } from './blockBindDescriptor'

export const render = () =>
  Server.renderToString(registered, implementation, {})
