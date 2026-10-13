import { Effect } from 'effect'
import { Server } from 'foldkit/experimental'

import { Application, Flags, implementation } from './application'
import { readCountCookie } from './cookie'

export const renderDocument = Server.renderDocument

const flagsForRequest = (request: Request): Flags => ({
  initialCount: readCountCookie(request.headers.get('cookie') ?? ''),
})

export const renderPage = (request: Request): Promise<Server.EntryResult> =>
  Effect.runPromise(
    Effect.gen(function* () {
      const renderedApplication = yield* Server.renderToString(
        Application,
        { ...implementation, Flags },
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
