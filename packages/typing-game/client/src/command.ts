import { Effect, Schema } from 'effect'
import { pushUrl } from 'foldkit/navigation'

import { Application } from './definition'
import { Message } from './message'
import { roomRouter } from './route'

export const NavigateToRoom = Application.command('NavigateToRoom', {
  args: { roomId: Schema.String },
  messages: [Message.CompletedNavigateToRoom],
  handler: function* () {
    return ({ roomId }) =>
      pushUrl(roomRouter({ roomId })).pipe(
        Effect.as(Message.CompletedNavigateToRoom()),
      )
  },
})
