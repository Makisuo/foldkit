import { Option } from 'effect'

import { FetchTelemetry } from './command'
import { Model, TelemetryAsyncData } from './model'
import {
  CHART_MODE_RADIO_GROUP_ID,
  ChartModeRadioGroup,
  PACKAGE_RADIO_GROUP_ID,
  PERIOD_RADIO_GROUP_ID,
  PackageRadioGroup,
  PeriodRadioGroup,
} from './radioGroups'

export const init = () => ({
  model: Model.make({
    telemetry: TelemetryAsyncData.Loading(),
    chartMode: 'Adoption',
    chartModeRadioGroup: ChartModeRadioGroup.init({
      id: CHART_MODE_RADIO_GROUP_ID,
    }).model,
    selectedPackageId: 'Core',
    packageRadioGroup: PackageRadioGroup.init({
      id: PACKAGE_RADIO_GROUP_ID,
    }).model,
    period: 'LastSixteenWeeks',
    periodRadioGroup: PeriodRadioGroup.init({
      id: PERIOD_RADIO_GROUP_ID,
    }).model,
    maybeChartHostId: Option.none(),
    maybeChartError: Option.none(),
    maybeSelectedDatumId: Option.none(),
  }),
  commands: [FetchTelemetry()],
})
