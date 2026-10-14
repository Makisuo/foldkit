// Pseudocode walkthrough of the Foldkit integration points. Each labeled
// block below is an excerpt. Fit them into your own Model, init, Message,
// update, and view definitions.
import { Schema } from 'effect'
import { Block, Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

import { Popover } from '@foldkit/ui'
import type { RenderInfo as PopoverRenderInfo } from '@foldkit/ui/popover'

// Add one Popover Block field for each level:
const Model = Schema.Struct({
  accountPopover: Popover.Model,
  accountDetailsPopover: Popover.Model,
  // ...your other fields
})
type Model = typeof Model.Type

// The parent uses contentFocus so focus can move into its nested trigger
// instead of staying on the panel:
const init = () => {
  const accountPopoverInit = accountPopover.init({
    id: 'account-popover',
    contentFocus: true,
  })
  const accountDetailsPopoverInit = accountDetailsPopover.init({
    id: 'account-details-popover',
  })

  return {
    model: {
      accountPopover: accountPopoverInit.model,
      accountDetailsPopover: accountDetailsPopoverInit.model,
      // ...your other fields
    },
    commands: [
      ...(accountPopoverInit.commands ?? []),
      ...(accountDetailsPopoverInit.commands ?? []),
    ],
  }
}

// Embed each Popover Message in your parent Message:
const Message = defineMessageUnion({
  GotAccountPopoverMessage: { message: Popover.Message },
  GotAccountDetailsPopoverMessage: { message: Popover.Message },
})
type Message = typeof Message.Type

const foldPopoverOutMessage = Popover.OutMessage.match<
  Update.Step<Model, Message>
>({
  Opened: () => model => ({ model }),
  Closed: () => model => ({ model }),
})

const accountPopover = Popover.block.connection({
  Model,
  field: 'accountPopover',
  parentMessage: Message.GotAccountPopoverMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

const accountDetailsPopover = Popover.block.connection({
  Model,
  field: 'accountDetailsPopover',
  parentMessage: Message.GotAccountDetailsPopoverMessage,
  outMessage: { fold: foldPopoverOutMessage },
})

const AccountMenuDefinition = Block.define('AccountMenu', {
  Model,
  Message,
})
const RegisteredAccountMenuDefinition = AccountMenuDefinition.register({
  children: [accountPopover, accountDetailsPopover],
})

const update = AccountMenuDefinition.update((model, message) =>
  Message.match(message, {
    GotAccountPopoverMessage: ({ message }) =>
      accountPopover.fold(model, message),
    GotAccountDetailsPopoverMessage: ({ message }) =>
      accountDetailsPopover.fold(model, message),
  }),
)

// Inside your view function, render the child Popover inside the parent
// panel. `focusSelector` points at the child trigger, which Popover derives
// from the child id as `${id}-button`.
const view = RegisteredAccountMenuDefinition.view((model, h) => {
  const accountDetailsPopoverView = ({
    button,
    panel,
    backdrop,
    isVisible,
  }: PopoverRenderInfo) =>
    h.div(
      [h.Class('relative inline-block')],
      [
        h.button(
          [...button, h.Class('rounded-lg border px-3 py-2 cursor-pointer')],
          [h.span([], ['Advanced settings'])],
        ),
        ...(isVisible
          ? [
              h.div([...backdrop, h.Class('fixed inset-0')]),
              h.div(
                [...panel, h.Class('rounded-lg border shadow-lg p-4 w-64')],
                [
                  h.p([h.Class('font-medium')], ['Permissions']),
                  h.p(
                    [h.Class('text-sm text-gray-500')],
                    [
                      'Review who can change billing, members, and integrations.',
                    ],
                  ),
                ],
              ),
            ]
          : []),
      ],
    )

  const detailsPopover = h.block(
    accountDetailsPopover.embedView({
      slotId: 'account-details-popover',
      model: model.accountDetailsPopover,
      viewInputs: {
        anchor: { placement: 'right-start', gap: 8, padding: 8 },
        toView: accountDetailsPopoverView,
      },
    }),
  )

  const accountPopoverView = ({
    button,
    panel,
    backdrop,
    isVisible,
  }: PopoverRenderInfo) =>
    h.div(
      [h.Class('relative inline-block')],
      [
        h.button(
          [...button, h.Class('rounded-lg border px-3 py-2 cursor-pointer')],
          [h.span([], ['Account'])],
        ),
        ...(isVisible
          ? [
              h.div([...backdrop, h.Class('fixed inset-0')]),
              h.div(
                [...panel, h.Class('rounded-lg border shadow-lg p-4 w-72')],
                [
                  h.p([], ['Manage account settings from this panel.']),
                  detailsPopover,
                ],
              ),
            ]
          : []),
      ],
    )

  return h.block(
    accountPopover.embedView({
      slotId: 'account-popover',
      model: model.accountPopover,
      viewInputs: {
        anchor: { placement: 'bottom-start', gap: 4, padding: 8 },
        focusSelector: '#account-details-popover-button',
        toView: accountPopoverView,
      },
    }),
  )
})
