import { AnimationBlock } from '@foldkit/ui'
import { defaultLeaveCommand } from '@foldkit/ui/animation'

import { UiDefinition } from '../definition'

const foldAnimationDemoOutMessage = UiDefinition.makeOutMessageFold(
  AnimationBlock,
  {
    StartedLeaveAnimating: (_outMessage, { liftCommand }) =>
      UiDefinition.step(model => ({
        model,
        commands: [liftCommand(defaultLeaveCommand(model.animationDemo))],
      })),
    TransitionedOut: () => UiDefinition.stepNoop(),
  },
)

export const AnimationDemoBinding = UiDefinition.bindChild(AnimationBlock, {
  field: 'animationDemo',
  init: { contextToArgs: () => [{ id: 'animation-demo' }] },
  outMessage: { fold: foldAnimationDemoOutMessage },
})
