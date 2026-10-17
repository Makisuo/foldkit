import { expect, test } from 'vitest'

import { Dialog } from '@foldkit/ui'

import { block } from './block'
import { init } from './init'
import { Message } from './message'
import { update } from './update'

test('Search clears on public close completion after cleanup and preserves prior reopened behavior', () => {
  const opened = update(
    init().model,
    Message.GotSearchDialogMessage({
      message: Dialog.Message.RequestedOpen(),
    }),
  )
  const queried = update(
    opened.model,
    Message.UpdatedSearchQuery({ query: 'routing' }),
  )
  const transitioned = update(
    queried.model,
    Message.GotSearchDialogMessage({
      message: Dialog.Message.RequestedClose(),
    }),
  )
  const reopened = update(
    transitioned.model,
    Message.GotSearchDialogMessage({
      message: Dialog.Message.RequestedOpen(),
    }),
  )
  const completed = update(
    reopened.model,
    Message.GotSearchDialogMessage({
      message: Dialog.Message.CompletedCloseDialog(),
    }),
  )

  expect(transitioned.model.query).toBe('routing')
  expect(reopened.model.query).toBe('routing')
  expect(reopened.model.dialog.isOpen).toBe(true)
  expect(completed.model.query).toBe('')
  expect(completed.model.searchState._tag).toBe('Idle')
  expect(completed.model.activeResultIndex).toBe(-1)
})

test('route changes clear and close Search while keyboard clearing leaves it open', () => {
  const opened = update(
    init().model,
    Message.GotSearchDialogMessage({
      message: Dialog.Message.RequestedOpen(),
    }),
  )
  const queried = update(
    opened.model,
    Message.UpdatedSearchQuery({ query: 'routing' }),
  )
  const cleared = update(queried.model, Message.ClearedSearchQuery())
  const retyped = update(
    cleared.model,
    Message.UpdatedSearchQuery({ query: 'composition' }),
  )
  const changedRoute = block.operations.informRouteChanged(retyped.model)

  expect(cleared.model.query).toBe('')
  expect(cleared.model.dialog.isOpen).toBe(true)
  expect(changedRoute.model.query).toBe('')
  expect(changedRoute.model.dialog.isOpen).toBe(false)
  expect(changedRoute.commands?.map(command => command.name)).toEqual([
    'dialog/CloseDialog',
  ])
})
