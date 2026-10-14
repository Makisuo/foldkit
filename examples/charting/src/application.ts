import { Layer } from 'effect'

import {
  chartModeRadioGroup,
  packageRadioGroup,
  periodRadioGroup,
} from './childBindings'
import { FetchTelemetry, SyncChart } from './command'
import { ApplicationDefinition } from './definition'
import { MountChart } from './view/chart'

export const EffectsLayer = Layer.mergeAll(
  FetchTelemetry.layer,
  SyncChart.layer,
  MountChart.layer,
)

export const ApplicationComposition = ApplicationDefinition.toComposition({
  mounts: [MountChart],
  children: [chartModeRadioGroup, periodRadioGroup, packageRadioGroup],
})
