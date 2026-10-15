import { Option, Schema } from 'effect'
import { expect, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import { define } from './define.js'

const ChildModel = Schema.Struct({ value: Schema.String })
type ChildModel = typeof ChildModel.Type

const Message = defineMessageUnion({ UpdatedValue: { value: Schema.String } })

const Child = define('ChildPlacementChild', {
  Model: ChildModel,
  Message,
})
const ChildBlock = Child.toComposition().toBlock({
  init: () => ({ model: ChildModel.make({ value: '' }) }),
  update: Child.update((model, { value }) => ({
    model: modifyFields(model, { value: () => value }),
  })),
})

const Entry = Schema.Struct({ id: Schema.String, child: ChildModel })
const ParentModel = Schema.Struct({
  primary: ChildModel,
  secondary: ChildModel,
  maybeChild: Schema.Option(ChildModel),
  entries: Schema.Array(Entry),
})
type ParentModel = typeof ParentModel.Type

const Parent = define('ChildPlacementParent', {
  Model: ParentModel,
  Message,
})

const primary = Parent.bindChild(ChildBlock, {
  field: 'primary',
  toParentMessage: message => message,
})

const secondaryAtPrimary = Parent.bindChild(ChildBlock, {
  field: 'secondary',
  placement: 'primary',
  toParentMessage: message => message,
})

const secondary = Parent.bindChild(ChildBlock, {
  field: 'secondary',
  toParentMessage: message => message,
})

const optional = Parent.bindChild(ChildBlock, {
  placement: 'optional',
  read: model => model.maybeChild,
  write: (model, nextChild) =>
    modifyFields(model, { maybeChild: () => Option.some(nextChild) }),
  toParentMessage: message => message,
})

const entries = Parent.bindChild(ChildBlock, {
  placement: 'entries',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_id, message) => message,
})

const entriesAtOptional = Parent.bindChild(ChildBlock, {
  placement: 'optional',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_id, message) => message,
})

const composition = Parent.toComposition({
  children: [primary, secondary, optional, entries],
})

const dynamicChildren: ReadonlyArray<
  typeof primary | typeof secondaryAtPrimary
> = [primary, secondaryAtPrimary]

if (false) {
  // @ts-expect-error Direct field defaults and explicit placements cannot resolve to the same sibling placement.
  Parent.toComposition({ children: [primary, secondaryAtPrimary] })

  // @ts-expect-error Static and keyed Bindings cannot resolve to the same sibling placement.
  Parent.toComposition({ children: [optional, entriesAtOptional] })
}

it('accepts distinct resolved sibling placements', () => {
  expect(composition.children.map(child => child.placement)).toEqual([
    'primary',
    'secondary',
    'optional',
    'entries',
  ])
})

it('rejects duplicate placements in a widened child list before completion', () => {
  expect(() => Parent.toComposition({ children: dynamicChildren })).toThrow(
    '[foldkit] Block "ChildPlacementParent" child Bindings at indexes 0 and 1 both resolve to placement "primary". Give each sibling Binding a unique placement.',
  )
})
