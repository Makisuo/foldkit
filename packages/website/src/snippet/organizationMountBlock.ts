import type { Block } from 'foldkit'

import { PanelComposition } from './composition'
import { init } from './init'
import type { Model } from './model'
import { MeasurePanel } from './mount'
import { update } from './update'
import { view } from './view'

export const EffectsLayer = MeasurePanel.layer

const assemblePanelBlock = () =>
  PanelComposition.assembleBlock({
    init,
    update,
    view,
    EffectsLayer,
  })

export const PanelBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assemblePanelBlock
> = assemblePanelBlock()
