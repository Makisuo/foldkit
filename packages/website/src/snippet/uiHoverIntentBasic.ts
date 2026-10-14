// Pseudocode walkthrough of the Foldkit integration points. Each labeled
// block below is an excerpt. Fit them into your own Model, init, Message,
// update, and view definitions.
import { Schema } from 'effect'
import { Block, Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

import { HoverIntent } from '@foldkit/ui'
import type { RenderInfo as HoverIntentRenderInfo } from '@foldkit/ui/hoverIntent'

// Add a field to your Model:
const Model = Schema.Struct({
  hoverIntent: HoverIntent.Model,
  // ...your other fields
})
type Model = typeof Model.Type

// Initialize it. This behavior primitive owns no DOM id:
const init = () => {
  const hoverIntentInit = hoverIntent.init({ openDelay: 200, closeDelay: 300 })

  return {
    model: {
      hoverIntent: hoverIntentInit.model,
      // ...your other fields
    },
    commands: hoverIntentInit.commands,
  }
}

// Embed child Messages in your parent Message:
const Message = defineMessageUnion({
  GotHoverIntentMessage: { message: HoverIntent.Message },
})
type Message = typeof Message.Type

const foldHoverIntentOutMessage = HoverIntent.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

const HoverIntentExample = Block.define('HoverIntentExample', {
  Model,
  Message,
})

const hoverIntent = HoverIntentExample.bindChild(HoverIntent.block, {
  field: 'hoverIntent',
  parentMessage: Message.GotHoverIntentMessage,
  outMessage: { fold: foldHoverIntentOutMessage },
})

const HoverIntentExampleComposition = HoverIntentExample.toComposition({
  children: [hoverIntent],
})

const update = HoverIntentExample.update((model, message) =>
  Message.match(message, {
    GotHoverIntentMessage: ({ message }) => hoverIntent.fold(model, message),
  }),
)

// Spread each attribute bundle onto the element it names. HoverIntent owns the
// interaction; this view owns the markup, semantics, positioning, and styles.
const triggerId = 'more-information-trigger'
const panelId = 'more-information-panel'

const view = HoverIntentExampleComposition.view((model, h) => {
  const hoverIntentView = ({
    trigger,
    panel,
    isVisible,
  }: HoverIntentRenderInfo) =>
    h.div(
      [],
      [
        h.button(
          [
            ...trigger,
            h.Type('button'),
            h.Id(triggerId),
            h.AriaControls(panelId),
            h.AriaExpanded(isVisible),
          ],
          ['More information'],
        ),
        ...(isVisible
          ? [
              h.div(
                [...panel, h.Id(panelId)],
                [h.p([], ['A short description can provide useful context.'])],
              ),
            ]
          : []),
      ],
    )

  return h.block(
    hoverIntent.embedView({
      slotId: 'more-information',
      model: model.hoverIntent,
      viewInputs: {
        focusTriggerSelector: `#${triggerId}`,
        toView: hoverIntentView,
      },
    }),
  )
})
