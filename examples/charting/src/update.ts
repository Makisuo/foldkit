import { Array, Option, Result, pipe } from 'effect'
import { AsyncData } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { FetchTelemetry, SyncChart } from './command'
import { Application as Authoring } from './definition'
import { Message } from './message'
import { Model, TelemetryAsyncData } from './model'
import {
  CHART_MODE_RADIO_GROUP_ID,
  ChartModeRadioGroup,
  PACKAGE_RADIO_GROUP_ID,
  PERIOD_RADIO_GROUP_ID,
  PackageRadioGroup,
  PeriodRadioGroup,
} from './radioGroups'
import { MountChart } from './view/chart'

const syncChart = (args: {
  maybeChartHostId: Model['maybeChartHostId']
  telemetry: Model['telemetry']
  chartMode: Model['chartMode']
  selectedPackageId: Model['selectedPackageId']
  period: Model['period']
  maybeSelectedDatumId: Model['maybeSelectedDatumId']
}) =>
  pipe(
    args.maybeChartHostId,
    Option.flatMap(hostId =>
      Option.map(AsyncData.getData(args.telemetry), telemetry =>
        SyncChart({
          hostId,
          telemetry,
          chartMode: args.chartMode,
          selectedPackageId: args.selectedPackageId,
          period: args.period,
          maybeSelectedDatumId: args.maybeSelectedDatumId,
        }),
      ),
    ),
    Array.fromOption,
  )

const refetchTelemetry = (model: Model) =>
  Option.match(AsyncData.revalidateOrLoad(model.telemetry), {
    onNone: () => ({ model }),
    onSome: nextTelemetry => ({
      model: modifyFields(model, { telemetry: () => nextTelemetry }),
      commands: [FetchTelemetry()],
    }),
  })

const selectedControl =
  (updateModel: (model: Model) => Model) => (model: Model) => {
    const nextModel = updateModel(
      modifyFields(model, { maybeSelectedDatumId: () => Option.none() }),
    )

    return {
      model: nextModel,
      commands: syncChart({
        maybeChartHostId: nextModel.maybeChartHostId,
        telemetry: nextModel.telemetry,
        chartMode: nextModel.chartMode,
        selectedPackageId: nextModel.selectedPackageId,
        period: nextModel.period,
        maybeSelectedDatumId: nextModel.maybeSelectedDatumId,
      }),
    }
  }

const foldChartModeRadioGroupOutMessage = ChartModeRadioGroup.OutMessage.match<
  ReturnType<typeof selectedControl>,
  typeof ChartModeRadioGroup.OutMessage.Type
>({
  Selected: ({ value }) =>
    selectedControl(modifyFields({ chartMode: () => value })),
})

export const chartModeRadioGroup = ChartModeRadioGroup.connection({
  placement: CHART_MODE_RADIO_GROUP_ID,
  Model: Model,
  field: 'chartModeRadioGroup',
  parentMessage: Message.GotChartModeRadioGroupMessage,
  outMessage: { fold: foldChartModeRadioGroupOutMessage },
})

const foldPeriodRadioGroupOutMessage = PeriodRadioGroup.OutMessage.match<
  ReturnType<typeof selectedControl>,
  typeof PeriodRadioGroup.OutMessage.Type
>({
  Selected: ({ value }) =>
    selectedControl(modifyFields({ period: () => value })),
})

export const periodRadioGroup = PeriodRadioGroup.connection({
  placement: PERIOD_RADIO_GROUP_ID,
  Model: Model,
  field: 'periodRadioGroup',
  parentMessage: Message.GotPeriodRadioGroupMessage,
  outMessage: { fold: foldPeriodRadioGroupOutMessage },
})

const foldPackageRadioGroupOutMessage = PackageRadioGroup.OutMessage.match<
  ReturnType<typeof selectedControl>,
  typeof PackageRadioGroup.OutMessage.Type
>({
  Selected: ({ value }) =>
    selectedControl(modifyFields({ selectedPackageId: () => value })),
})

export const packageRadioGroup = PackageRadioGroup.connection({
  placement: PACKAGE_RADIO_GROUP_ID,
  Model: Model,
  field: 'packageRadioGroup',
  parentMessage: Message.GotPackageRadioGroupMessage,
  outMessage: { fold: foldPackageRadioGroupOutMessage },
})

export const Application = Authoring.register({
  mounts: [MountChart],
  children: [chartModeRadioGroup, periodRadioGroup, packageRadioGroup],
})

export const update = Application.update((model, message) =>
  Message.match(message, {
    GotChartModeRadioGroupMessage: ({ message }) =>
      chartModeRadioGroup.fold(model, message),

    GotPeriodRadioGroupMessage: ({ message }) =>
      periodRadioGroup.fold(model, message),

    GotPackageRadioGroupMessage: ({ message }) =>
      packageRadioGroup.fold(model, message),

    ClickedRefresh: () => refetchTelemetry(model),

    ClickedRetry: () => refetchTelemetry(model),

    ClickedChartDatum: ({ datumId }) => ({
      model: modifyFields(model, {
        maybeSelectedDatumId: () => Option.some(datumId),
      }),
      commands: syncChart({
        maybeChartHostId: model.maybeChartHostId,
        telemetry: model.telemetry,
        chartMode: model.chartMode,
        selectedPackageId: model.selectedPackageId,
        period: model.period,
        maybeSelectedDatumId: Option.some(datumId),
      }),
    }),

    SucceededFetchTelemetry: ({ telemetry }) => {
      const nextModel = modifyFields(model, {
        telemetry: () => TelemetryAsyncData.Success({ data: telemetry }),
      })
      return {
        model: nextModel,
        commands: syncChart({
          maybeChartHostId: nextModel.maybeChartHostId,
          telemetry: nextModel.telemetry,
          chartMode: nextModel.chartMode,
          selectedPackageId: nextModel.selectedPackageId,
          period: nextModel.period,
          maybeSelectedDatumId: nextModel.maybeSelectedDatumId,
        }),
      }
    },

    FailedFetchTelemetry: ({ error }) => ({
      model: modifyFields(model, {
        telemetry: () => AsyncData.settle(model.telemetry, Result.fail(error)),
      }),
    }),

    SucceededMountChart: ({ hostId }) => ({
      model: modifyFields(model, {
        maybeChartHostId: () => Option.some(hostId),
        maybeChartError: () => Option.none(),
      }),
      commands: syncChart({
        maybeChartHostId: Option.some(hostId),
        telemetry: model.telemetry,
        chartMode: model.chartMode,
        selectedPackageId: model.selectedPackageId,
        period: model.period,
        maybeSelectedDatumId: model.maybeSelectedDatumId,
      }),
    }),

    FailedMountChart: ({ reason }) => ({
      model: modifyFields(model, {
        maybeChartError: () => Option.some(reason),
      }),
    }),

    SucceededSyncChart: () => ({
      model: modifyFields(model, {
        maybeChartError: () => Option.none(),
      }),
    }),

    FailedSyncChart: ({ reason }) => ({
      model: modifyFields(model, {
        maybeChartError: () => Option.some(reason),
      }),
    }),
  }),
)
