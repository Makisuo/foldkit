import { Option } from 'effect'
import { Block } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import * as Scene from 'foldkit/scene'
import * as Update from 'foldkit/update'

import { describe, it } from '@effect/vitest'

import { Message, Model, OutMessage, block, init } from './index.js'

const HoverIntentSceneMessage = defineMessageUnion({
  GotHoverIntentMessage: { message: Message },
})

const HoverIntentSceneDefinition = Block.define('HoverIntentScene', {
  Model,
  Message: HoverIntentSceneMessage,
})

const foldHoverIntentOutMessage = OutMessage.match<
  Update.Step<Model, typeof HoverIntentSceneMessage.Type>
>({
  Opened: () => HoverIntentSceneDefinition.step(model => ({ model })),
  Closed: () => HoverIntentSceneDefinition.step(model => ({ model })),
})

const HoverIntentBinding = HoverIntentSceneDefinition.bindChild(block, {
  read: model => Option.some(model),
  write: (_model, nextHoverIntent) => nextHoverIntent,
  parentMessage: HoverIntentSceneMessage.GotHoverIntentMessage,
  outMessage: { fold: foldHoverIntentOutMessage },
})

const HoverIntentSceneComposition = HoverIntentSceneDefinition.makeComposition({
  childBindings: [HoverIntentBinding],
})

const update = HoverIntentSceneComposition.makeUpdate()

const sceneView = HoverIntentSceneComposition.makeView((model, h) =>
  h.block(
    HoverIntentBinding.embedView({
      slotId: 'hover-intent',
      model,
      viewInputs: {
        toView: ({ trigger, panel, isVisible }) =>
          h.div(
            [],
            [
              h.button([h.Id('trigger'), ...trigger], ['Preview']),
              ...(isVisible
                ? [h.div([h.Id('panel'), ...panel], ['Content'])]
                : []),
            ],
          ),
      },
    }),
  ),
)

const trigger = Scene.selector('#trigger')
const panel = Scene.selector('#panel')

const hiddenModel = init()
const focusedUpdate = update(
  hiddenModel,
  HoverIntentSceneMessage.GotHoverIntentMessage({
    message: Message.FocusedTrigger(),
  }),
)

describe('HoverIntent', () => {
  describe('view', () => {
    it('attaches hover, focus, and Escape handlers to the trigger', () => {
      Scene.scene(
        { update, view: sceneView },
        Scene.given(hiddenModel),
        Scene.expect(trigger).toHaveHandler('mouseenter'),
        Scene.expect(trigger).toHaveHandler('mouseleave'),
        Scene.expect(trigger).toHaveHandler('focus'),
        Scene.expect(trigger).toHaveHandler('blur'),
        Scene.expect(trigger).toHaveHandler('keydown'),
      )
    })

    it('leaves panel markup to the consumer while hidden', () => {
      Scene.scene(
        { update, view: sceneView },
        Scene.given(hiddenModel),
        Scene.expect(panel).toBeAbsent(),
      )
    })

    it('attaches the same interaction handlers to a visible panel', () => {
      Scene.scene(
        { update, view: sceneView },
        Scene.given(focusedUpdate.model),
        Scene.expect(panel).toHaveHandler('mouseenter'),
        Scene.expect(panel).toHaveHandler('mouseleave'),
        Scene.expect(panel).toHaveHandler('focusin'),
        Scene.expect(panel).toHaveHandler('focusout'),
        Scene.expect(panel).toHaveHandler('keydown'),
      )
    })

    it('does not impose a role, ARIA attribute, or positioning style', () => {
      Scene.scene(
        { update, view: sceneView },
        Scene.given(focusedUpdate.model),
        Scene.expect(panel).not.toHaveAttr('role'),
        Scene.expect(panel).not.toHaveAttr('aria-controls'),
        Scene.expect(panel).not.toHaveStyle('position', 'absolute'),
      )
    })
  })
})
