import * as Popover from '@foldkit/ui/popover'
import * as Slider from '@foldkit/ui/slider'
import * as Tooltip from '@foldkit/ui/tooltip'

import {
  ApplicationDefinition,
  DialogBinding,
  Picker,
  PickerBinding,
  RootSlider,
  ToastBlock,
  helper,
} from './generic-composition.accepted.js'

// @ts-expect-error The connected Dialog operation takes no arguments.
DialogBinding.requestOpen('unexpected')

Picker.Message.SelectedItem({
  // @ts-expect-error The refined Message rejects an item outside its Schema.
  item: 'Banana',
  displayText: 'Banana',
  wasSelected: false,
})

// @ts-expect-error The connected operation preserves the item Schema.
PickerBinding.requestSelectItem('Banana', 'Banana')

ToastBlock.operations.requestShow(
  ToastBlock.init({ id: 'invalid-toast' }).model,
  {
    payload: {
      // @ts-expect-error Toast show retains the payload Schema refinement.
      kind: 'Unknown',
    },
  },
)
ToastBlock.operations.requestShow(
  ToastBlock.init({ id: 'invalid-duration' }).model,
  {
    payload: { kind: 'Saved' },
    // @ts-expect-error Toast show accepts Effect Duration inputs only.
    duration: false,
  },
)
Slider.block.operations.informRangeChanged(
  Slider.init({ id: 'invalid-range', min: 0, max: 100, step: 1 }),
  // @ts-expect-error The Slider range requires both numeric bounds.
  { min: 10 },
)
RootSlider.operations.informRangeChanged(
  Slider.init({ id: 'invalid-root-range', min: 0, max: 100, step: 1 }),
  {
    // @ts-expect-error A custom-root Slider retains numeric range arguments.
    min: 'zero',
    max: 100,
  },
)
Tooltip.block.operations.informShowDelayChanged(
  Tooltip.init({ id: 'invalid-delay' }),
  // @ts-expect-error Tooltip delay accepts Effect Duration inputs only.
  false,
)

// @ts-expect-error Parent wrapper Messages require their registered child Bindings.
const Missing = ApplicationDefinition.makeComposition()
Missing.makeView((model, h) => {
  // @ts-expect-error The helper requires both registered child Bindings.
  helper(model, h)

  h.OnMount(
    // @ts-expect-error The direct Popover Mount is unavailable.
    Popover.AnchorPopover({
      buttonId: 'missing',
      anchor: { placement: 'bottom' },
    }),
  )

  return h.div([])
})
