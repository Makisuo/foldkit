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

const defaultAccessor = Parent.bindChild(ChildBlock, {
  read: model => model.maybeChild,
  write: (model, nextChild) =>
    modifyFields(model, { maybeChild: () => Option.some(nextChild) }),
  toParentMessage: message => message,
})

const defaultEntriesById = Parent.bindChild(ChildBlock, {
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_id, message) => message,
})

const defaultEntriesByIdLength = Parent.bindChild(ChildBlock, {
  readAll: model => model.entries,
  key: entry => entry.id.length,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_idLength, message) => message,
})

const entriesById = Parent.bindChild(ChildBlock, {
  placement: 'entriesById',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_id, message) => message,
})

const entriesByIdLength = Parent.bindChild(ChildBlock, {
  placement: 'entriesByIdLength',
  readAll: model => model.entries,
  key: entry => entry.id.length,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_idLength, message) => message,
})

const composition = Parent.toComposition({
  children: [primary, secondary, optional, entries],
})

const defaultPlacementComposition = Parent.toComposition({
  children: [defaultAccessor, entriesById, entriesByIdLength],
})

const dynamicChildren: ReadonlyArray<
  typeof primary | typeof secondaryAtPrimary
> = [primary, secondaryAtPrimary]

const dynamicDefaultMixedChildren: ReadonlyArray<
  typeof defaultAccessor | typeof defaultEntriesById
> = [defaultAccessor, defaultEntriesById]

const dynamicDefaultKeyedChildren: ReadonlyArray<
  typeof defaultEntriesById | typeof defaultEntriesByIdLength
> = [defaultEntriesById, defaultEntriesByIdLength]

if (false) {
  // @ts-expect-error Direct field defaults and explicit placements cannot resolve to the same sibling placement.
  Parent.toComposition({ children: [primary, secondaryAtPrimary] })

  // @ts-expect-error Static and keyed Bindings cannot resolve to the same sibling placement.
  Parent.toComposition({ children: [optional, entriesAtOptional] })

  // @ts-expect-error Default accessor and keyed Bindings of the same child Block resolve to the same placement.
  Parent.toComposition({ children: [defaultAccessor, defaultEntriesById] })

  // @ts-expect-error Keyed occurrence keys do not distinguish sibling Binding placements.
  Parent.toComposition({
    children: [defaultEntriesById, defaultEntriesByIdLength],
  })
}

it('accepts distinct resolved sibling placements', () => {
  expect(composition.children.map(child => child.placement)).toEqual([
    'primary',
    'secondary',
    'optional',
    'entries',
  ])
  expect(
    defaultPlacementComposition.children.map(child => child.placement),
  ).toEqual(['ChildPlacementChild', 'entriesById', 'entriesByIdLength'])
})

it('rejects duplicate placements in a widened child list before completion', () => {
  expect(() => Parent.toComposition({ children: dynamicChildren })).toThrow(
    '[foldkit] Block "ChildPlacementParent" child Bindings at indexes 0 and 1 both resolve to placement "primary". Give each sibling Binding a unique placement.',
  )
})

it('rejects widened default placements before completion', () => {
  for (const children of [
    dynamicDefaultMixedChildren,
    dynamicDefaultKeyedChildren,
  ]) {
    expect(() => Parent.toComposition({ children })).toThrow(
      '[foldkit] Block "ChildPlacementParent" child Bindings at indexes 0 and 1 both resolve to placement "ChildPlacementChild". Give each sibling Binding a unique placement.',
    )
  }
})
