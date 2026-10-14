import { Effect } from 'effect'
import { Server } from 'foldkit/experimental'

import { Application } from './application'
import { readCountCookie } from './cookie'
import { Flags } from './flags'
import { init } from './init'
import { update } from './update'
import { view } from './view'

export const renderDocument = Server.renderDocument

const flagsForRequest = (request: Request): Flags => ({
  initialCount: readCountCookie(request.headers.get('cookie') ?? ''),
})

export const renderPage = (request: Request): Promise<Server.EntryResult> =>
  Effect.runPromise(
    Effect.gen(function* () {
      const renderedApplication = yield* Server.renderToString(
        Application,
        { init, update, view, Flags },
        {
          flags: flagsForRequest(request),
        },
      )

      return Server.Rendered(renderedApplication, {
        headers: {
          'cache-control': 'private, no-store',
          vary: 'cookie',
        },
      })
    }),
  )
