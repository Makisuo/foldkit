import { Option } from 'effect'

import {
  ChildBlock,
  Parent,
  optional,
  primary,
} from './child-placement.accepted.js'

const directAtPrimary = Parent.bindChild(ChildBlock, {
  field: 'secondary',
  placement: 'primary',
  toParentMessage: message => message,
})

const keyedAtOptional = Parent.bindChild(ChildBlock, {
  placement: 'optional',
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_id, message) => message,
})

const accessorAtPrimary = Parent.bindChild(ChildBlock, {
  placement: 'primary',
  read: model => Option.some(model.secondary),
  write: model => model,
  toParentMessage: message => message,
})

const defaultAccessor = Parent.bindChild(ChildBlock, {
  read: model => model.maybeChild,
  write: model => model,
  toParentMessage: message => message,
})

const defaultKeyedById = Parent.bindChild(ChildBlock, {
  readAll: model => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_id, message) => message,
})

const defaultKeyedByIdLength = Parent.bindChild(ChildBlock, {
  readAll: model => model.entries,
  key: entry => entry.id.length,
  read: entry => entry.child,
  writeAt: model => model,
  toParentMessage: (_idLength, message) => message,
})

// @ts-expect-error A direct field default and explicit placement cannot resolve to the same sibling placement.
Parent.toComposition({ children: [primary, directAtPrimary] })

// @ts-expect-error Static and keyed Bindings cannot resolve to the same sibling placement.
Parent.toComposition({ children: [optional, keyedAtOptional] })

// @ts-expect-error Pure siblings cannot repeat a resolved placement.
Parent.toComposition({ children: [primary, accessorAtPrimary] })

// @ts-expect-error Default accessor and keyed Bindings of the same child Block resolve to the same placement.
Parent.toComposition({ children: [defaultAccessor, defaultKeyedById] })

// @ts-expect-error Keyed occurrence keys do not distinguish sibling Binding placements.
Parent.toComposition({
  children: [defaultKeyedById, defaultKeyedByIdLength],
})
