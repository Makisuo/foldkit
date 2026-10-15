import {
  Array,
  Layer,
  Match,
  Number,
  Option,
  Schema,
  Stream,
  pipe,
} from 'effect'
import { type Block, Dom, Runtime } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  Application,
  Message,
  Model,
  SlowWarning,
  SlowWarningReport,
  Workload,
} from './definition'
import {
  PATCH_ROW_COUNT,
  SUBSCRIPTION_DEPENDENCIES_WORK_MS,
  UPDATE_WORK_MS,
  burnCpu,
} from './workload'

const MAX_WARNING_COUNT = 8
const SLOW_WARNING_EVENT = 'foldkit:slow-warning'

export const ApplicationComposition = Application.toComposition()
export type ApplicationViewBuilder = Block.HtmlBuilderOf<
  typeof ApplicationComposition
>

const slowWarningTarget: Dom.TypedEventTarget<{
  [SLOW_WARNING_EVENT]: CustomEvent<SlowWarningReport>
}> = new EventTarget()

const messageToTag = ({ _tag }: Message): string => _tag

const maybeMessageTrigger = (message: Option.Option<Message>): string =>
  Option.match(message, {
    onNone: () => 'initial render',
    onSome: messageToTag,
  })

const triggerForSlowContext = (
  context: Runtime.SlowContext<Model, Message>,
): string =>
  Match.value(context).pipe(
    Match.withReturnType<string>(),
    Match.tagsExhaustive({
      Update: ({ message }) => messageToTag(message),
      View: ({ message }) => maybeMessageTrigger(message),
      Patch: ({ message }) => maybeMessageTrigger(message),
      SubscriptionDependencies: ({ subscriptionKey }) => subscriptionKey,
    }),
  )

const detailsForSlowContext = (
  context: Runtime.SlowContext<Model, Message>,
): string =>
  Match.value(context).pipe(
    Match.withReturnType<string>(),
    Match.tagsExhaustive({
      Update: () =>
        'CPU work ran inside update before Foldkit could return the next Model.',
      View: () =>
        'The view function performed expensive synchronous work while building the next VNode tree.',
      Patch: () =>
        'The patch phase inserted thousands of keyed rows into the live DOM.',
      SubscriptionDependencies: () =>
        'A subscription spent time deriving its dependency struct from the Model.',
    }),
  )

const slowContextToReport = (
  context: Runtime.SlowContext<Model, Message>,
): SlowWarningReport => ({
  phase: context._tag,
  durationMs: context.durationMs,
  thresholdMs: context.thresholdMs,
  trigger: triggerForSlowContext(context),
  details: detailsForSlowContext(context),
})

export const handleSlow = (
  context: Runtime.SlowContext<Model, Message>,
): void => {
  Runtime.defaultSlowCallback(context)

  const report = slowContextToReport(context)
  slowWarningTarget.dispatchEvent(
    new CustomEvent<SlowWarningReport>(SLOW_WARNING_EVENT, {
      detail: report,
    }),
  )
}

const prependWarning =
  (warning: SlowWarning) =>
  (warnings: ReadonlyArray<SlowWarning>): ReadonlyArray<SlowWarning> =>
    pipe(warnings, Array.prepend(warning), Array.take(MAX_WARNING_COUNT))

export const update = ApplicationComposition.update((model, message) =>
  Message.match(message, {
    ClickedRunUpdateWork: () => {
      burnCpu(UPDATE_WORK_MS)

      return {
        model: modifyFields(model, {
          activeWorkload: () => 'Update',
        }),
      }
    },
    ClickedRunViewWork: () => ({
      model: modifyFields(model, {
        activeWorkload: () => 'View',
      }),
    }),
    ClickedRunPatchWork: () => ({
      model: modifyFields(model, {
        activeWorkload: () => 'Patch',
        patchRows: () => PATCH_ROW_COUNT,
        patchRun: Number.increment,
      }),
    }),
    ClickedRunSubscriptionDependenciesWork: () => ({
      model: modifyFields(model, {
        activeWorkload: () => 'SubscriptionDependencies',
      }),
    }),
    ClickedClearWarnings: () => ({
      model: modifyFields(model, {
        activeWorkload: () => 'Idle',
        warnings: () => [],
      }),
    }),
    RecordedSlowWarning: ({ report }) => {
      const warning: SlowWarning = {
        id: model.nextWarningId,
        ...report,
      }

      return {
        model: modifyFields(model, {
          activeWorkload: () => 'Idle',
          nextWarningId: Number.increment,
          warnings: prependWarning(warning),
        }),
      }
    },
  }),
)

export const init = () => ({
  model: Model.make({
    activeWorkload: 'Idle',
    nextWarningId: 1,
    warnings: [],
    patchRows: 0,
    patchRun: 0,
  }),
})

export const subscriptions = Application.subscriptions(entry => ({
  slowWarningReports: entry('SlowWarningReports', {
    messages: [Message.RecordedSlowWarning],
    handler: function* () {
      return () =>
        Dom.streamFromEventFilterMap({
          target: slowWarningTarget,
          type: SLOW_WARNING_EVENT,
          filterMapEvent: event =>
            pipe(
              event.detail,
              Schema.decodeOption(SlowWarningReport),
              Option.map(report => Message.RecordedSlowWarning({ report })),
            ),
        })
    },
  }),
  dependencyExtractionWork: entry(
    'DependencyExtractionWork',
    { activeWorkload: Workload },
    {
      modelToDependencies: model => {
        if (model.activeWorkload === 'SubscriptionDependencies') {
          burnCpu(SUBSCRIPTION_DEPENDENCIES_WORK_MS)
        }

        return { activeWorkload: model.activeWorkload }
      },
      messages: [],
      handler: function* () {
        return () => Stream.empty
      },
    },
  ),
}))

export const EffectsLayer = Layer.mergeAll(
  subscriptions.slowWarningReports.layer,
  subscriptions.dependencyExtractionWork.layer,
)
