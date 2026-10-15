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

// @ts-expect-error A direct field default and explicit placement cannot resolve to the same sibling placement.
Parent.toComposition({ children: [primary, directAtPrimary] })

// @ts-expect-error Static and keyed Bindings cannot resolve to the same sibling placement.
Parent.toComposition({ children: [optional, keyedAtOptional] })

// @ts-expect-error Pure siblings cannot repeat a resolved placement.
Parent.toComposition({ children: [primary, accessorAtPrimary] })
