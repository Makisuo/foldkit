import { Layer } from 'effect'
import type { Block } from 'foldkit'

import {
  chartModeRadioGroup,
  packageRadioGroup,
  periodRadioGroup,
} from './childBindings'
import { FetchTelemetry, SyncChart } from './command'
import { Application } from './definition'
import { MountChart } from './view/chart'

export const EffectsLayer = Layer.mergeAll(
  FetchTelemetry.layer,
  SyncChart.layer,
  MountChart.layer,
)

export const ApplicationComposition = Application.toComposition({
  mounts: [MountChart],
  children: [chartModeRadioGroup, periodRadioGroup, packageRadioGroup],
})

export type ViewBuilder = Block.HtmlBuilderOf<typeof ApplicationComposition>
