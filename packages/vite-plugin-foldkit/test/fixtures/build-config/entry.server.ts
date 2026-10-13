import { Effect } from 'effect'
import { Server } from 'foldkit/experimental'

export const renderDocument = Server.renderDocument

import { Application, Flags, implementation } from './application'

export const renderPage = (): Promise<Server.EntryResult> =>
  Effect.runPromise(
    Server.renderToString(
      Application,
      { ...implementation, Flags },
      { flags: { start: 0 } },
    ).pipe(Effect.map(Server.Rendered)),
  )
