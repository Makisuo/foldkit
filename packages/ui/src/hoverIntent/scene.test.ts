import { Option } from 'effect'
import { Block } from 'foldkit'
import * as Scene from 'foldkit/scene'
import * as Update from 'foldkit/update'

import { describe, it } from '@effect/vitest'

import { Message, Model, OutMessage, block, init } from './index.js'

const HoverIntentScene = Block.define('HoverIntentScene', {
  Model,
  Message,
})

const foldHoverIntentOutMessage = OutMessage.match<Update.Step<Model, Message>>(
  {
    Opened: () => model => ({ model }),
    Closed: () => model => ({ model }),
  },
)

const hoverIntent = HoverIntentScene.bindChild(block, {
  read: model => Option.some(model),
  write: (_model, nextHoverIntent) => nextHoverIntent,
  toParentMessage: message => message,
  outMessage: { fold: foldHoverIntentOutMessage },
})

const HoverIntentSceneComposition = HoverIntentScene.toComposition({
  children: [hoverIntent],
})

const update = HoverIntentScene.update((model, message) =>
  hoverIntent.fold(model, message),
)

const sceneView = HoverIntentSceneComposition.view((model, h) =>
  h.block(
    hoverIntent.embedView({
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
const focusedUpdate = update(hiddenModel, Message.FocusedTrigger())

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
