import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { Slider } from '@foldkit/ui'

import { Application } from './definition'
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
