import { Effect } from 'effect'
import { Server } from 'foldkit/experimental'

import { ApplicationDefinition, Flags, init, update, view } from './application'

export const renderDocument = Server.renderDocument

export const renderPage = (): Promise<Server.EntryResult> =>
  Effect.runPromise(
    Server.renderToString(
      ApplicationDefinition,
      { init, update, view, Flags },
      { flags: { start: 0 } },
    ).pipe(Effect.map(Server.Rendered)),
  )
