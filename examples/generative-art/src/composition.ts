import { type Block, Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Slider } from '@foldkit/ui'

import {
  FLOW_STRENGTH_MAX,
  FLOW_STRENGTH_MIN,
  FLOW_STRENGTH_STEP,
  NOISE_SCALE_MAX_DIVISOR,
  NOISE_SCALE_MIN_DIVISOR,
  NOISE_SCALE_STEP,
} from './constant'
import { ApplicationDefinition } from './definition'
import { Message } from './message'
import { Model } from './model'

const foldFlowStrengthSliderOutMessage = Slider.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedValue:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { flowStrength: () => value }),
    }),
})

export const FlowStrengthSliderBinding = ApplicationDefinition.bindChild(
  Slider.block,
  {
    field: 'flowStrengthSlider',
    parentMessage: Message.GotFlowStrengthSliderMessage,
    init: {
      startupToArgs: () => [
        {
          id: 'flow-strength-slider',
          min: FLOW_STRENGTH_MIN,
          max: FLOW_STRENGTH_MAX,
          step: FLOW_STRENGTH_STEP,
        },
      ],
    },
    outMessage: { fold: foldFlowStrengthSliderOutMessage },
  },
)

const foldNoiseScaleSliderOutMessage = Slider.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedValue:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { noiseScale: () => value }),
    }),
})

export const NoiseScaleSliderBinding = ApplicationDefinition.bindChild(
  Slider.block,
  {
    field: 'noiseScaleSlider',
    parentMessage: Message.GotNoiseScaleSliderMessage,
    init: {
      startupToArgs: () => [
        {
          id: 'noise-scale-slider',
          min: NOISE_SCALE_MIN_DIVISOR,
          max: NOISE_SCALE_MAX_DIVISOR,
          step: NOISE_SCALE_STEP,
        },
      ],
    },
    outMessage: { fold: foldNoiseScaleSliderOutMessage },
  },
)

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  childBindings: [FlowStrengthSliderBinding, NoiseScaleSliderBinding],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
