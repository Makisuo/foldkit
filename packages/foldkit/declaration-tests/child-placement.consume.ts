import {
  DefaultPlacementComposition,
  ParentComposition,
  composeDynamicChildren,
  defaultAccessor,
  entries,
  entriesById,
  entriesByIdLength,
  optional,
  primary,
  secondary,
} from './child-placement.accepted.js'

const primaryPlacement: 'primary' = primary.placement
const secondaryPlacement: 'secondaryPlacement' = secondary.placement
const optionalPlacement: 'optional' = optional.placement
const entriesPlacement: 'entries' = entries.placement
const defaultAccessorPlacement: 'DeclarationChildPlacementChild' =
  defaultAccessor.placement
const entriesByIdPlacement: 'entriesById' = entriesById.placement
const entriesByIdLengthPlacement: 'entriesByIdLength' =
  entriesByIdLength.placement

const children: readonly [
  typeof primary,
  typeof secondary,
  typeof optional,
  typeof entries,
] = ParentComposition.children

const defaultPlacementChildren: readonly [
  typeof defaultAccessor,
  typeof entriesById,
  typeof entriesByIdLength,
] = DefaultPlacementComposition.children

composeDynamicChildren([primary, primary])

void primaryPlacement
void secondaryPlacement
void optionalPlacement
void entriesPlacement
void defaultAccessorPlacement
void entriesByIdPlacement
void entriesByIdLengthPlacement
void children
void defaultPlacementChildren
