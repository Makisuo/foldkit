import {
  ParentComposition,
  composeDynamicChildren,
  entries,
  optional,
  primary,
  secondary,
} from './child-placement.accepted.js'

const primaryPlacement: 'primary' = primary.placement
const secondaryPlacement: 'secondaryPlacement' = secondary.placement
const optionalPlacement: 'optional' = optional.placement
const entriesPlacement: 'entries' = entries.placement

const children: readonly [
  typeof primary,
  typeof secondary,
  typeof optional,
  typeof entries,
] = ParentComposition.children

composeDynamicChildren([primary, primary])

void primaryPlacement
void secondaryPlacement
void optionalPlacement
void entriesPlacement
void children
