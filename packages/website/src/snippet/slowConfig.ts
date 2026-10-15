import { Match } from 'effect'
import { Runtime } from 'foldkit'

import * as Sentry from '@sentry/browser'

import { ApplicationComposition, init, update, view } from './application'
import type { Message } from './message'
import type { Model } from './model'

const handleSlow = (context: Runtime.SlowContext<Model, Message>): void => {
  const summary = Match.value(context).pipe(
    Match.tagsExhaustive({
      View: ({ durationMs, thresholdMs }) =>
        `view ${durationMs.toFixed(1)}ms (budget ${thresholdMs}ms)`,
      Update: ({ durationMs, thresholdMs, message }) =>
        `update ${durationMs.toFixed(1)}ms (budget ${thresholdMs}ms) [${message._tag}]`,
      Patch: ({ durationMs, thresholdMs }) =>
        `patch ${durationMs.toFixed(1)}ms (budget ${thresholdMs}ms)`,
      SubscriptionDependencies: ({
        durationMs,
        thresholdMs,
        subscriptionKey,
      }) =>
        `subscription dependencies "${subscriptionKey}" ${durationMs.toFixed(1)}ms (budget ${thresholdMs}ms)`,
    }),
  )

  Sentry.captureMessage(`[foldkit slow] ${summary}`)
}

const application = ApplicationComposition.toApplication({
  init,
  update,
  view,
  container: document.getElementById('root'),
  slow: {
    show: 'Always',
    onSlow: handleSlow,
    thresholdOverrides: {
      Update: 4,
      View: 12,
      Patch: 8,
      SubscriptionDependencies: 1,
    },
  },
})

Runtime.run(application)
