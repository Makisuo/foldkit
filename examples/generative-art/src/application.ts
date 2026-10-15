import { Array, Layer, Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Slider } from '@foldkit/ui'
import { snapAndClamp } from '@foldkit/ui/slider'

import { GenerateAmbientParticle, GenerateBurstParticle } from './command'
import {
  FLOW_STRENGTH_MAX,
  FLOW_STRENGTH_MIN,
  FLOW_STRENGTH_STEP,
  INITIAL_FLOW_STRENGTH,
  INITIAL_NOISE_SCALE,
  INITIAL_PARTICLE_COUNT,
  NOISE_SCALE_MAX_DIVISOR,
  NOISE_SCALE_MIN_DIVISOR,
  NOISE_SCALE_STEP,
} from './constant'
import { Application } from './definition'
import { Message } from './message'
import { Model } from './model'
import { subscriptions } from './subscription'

const foldFlowStrengthSliderOutMessage = Slider.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedValue:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { flowStrength: () => value }),
    }),
})

export const flowStrengthSlider = Application.bindChild(Slider.block, {
  field: 'flowStrengthSlider',
  parentMessage: Message.GotFlowStrengthSliderMessage,
  outMessage: { fold: foldFlowStrengthSliderOutMessage },
})

const foldNoiseScaleSliderOutMessage = Slider.OutMessage.match<
  Update.Step<Model, Message>
>({
  ChangedValue:
    ({ value }) =>
    model => ({
      model: modifyFields(model, { noiseScale: () => value }),
    }),
})

export const noiseScaleSlider = Application.bindChild(Slider.block, {
  field: 'noiseScaleSlider',
  parentMessage: Message.GotNoiseScaleSliderMessage,
  outMessage: { fold: foldNoiseScaleSliderOutMessage },
})

export const EffectsLayer = Layer.mergeAll(
  GenerateAmbientParticle.layer,
  GenerateBurstParticle.layer,
  subscriptions.animationFrameTicks.layer,
)

export const init = () => ({
  model: {
    particles: [],
    nextId: 0,
    elapsedSeconds: 0,
    maybeMousePosition: Option.none(),
    isRunning: true,
    flowStrength: snapAndClamp(
      INITIAL_FLOW_STRENGTH,
      FLOW_STRENGTH_MIN,
      FLOW_STRENGTH_MAX,
      FLOW_STRENGTH_STEP,
    ),
    flowStrengthSlider: Slider.init({
      id: 'flow-strength-slider',
      min: FLOW_STRENGTH_MIN,
      max: FLOW_STRENGTH_MAX,
      step: FLOW_STRENGTH_STEP,
    }),
    noiseScale: snapAndClamp(
      INITIAL_NOISE_SCALE,
      NOISE_SCALE_MIN_DIVISOR,
      NOISE_SCALE_MAX_DIVISOR,
      NOISE_SCALE_STEP,
    ),
    noiseScaleSlider: Slider.init({
      id: 'noise-scale-slider',
      min: NOISE_SCALE_MIN_DIVISOR,
      max: NOISE_SCALE_MAX_DIVISOR,
      step: NOISE_SCALE_STEP,
    }),
  },
  commands: Array.makeBy(INITIAL_PARTICLE_COUNT, () =>
    GenerateAmbientParticle(),
  ),
})

export const ApplicationComposition = Application.toComposition({
  children: [flowStrengthSlider, noiseScaleSlider],
})
