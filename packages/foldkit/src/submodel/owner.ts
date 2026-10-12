import { type DefineOwnedSubmodel, makeDefinition } from './definition.js'
import { assertOwnerNamespace, makeOwnedName } from './ownerName.js'

/**
 * The namespace and runtime identity for one Submodel.
 */
export interface Owner<Namespace extends string> {
  readonly namespace: Namespace
  readonly name: <const LocalName extends string>(
    localName: LocalName extends ''
      ? never
      : LocalName extends `${string}/${string}`
        ? never
        : LocalName,
  ) => `${Namespace}/${LocalName}`
  readonly define: DefineOwnedSubmodel<Owner<Namespace>>
}

/**
 * Creates the namespace used to author a Submodel.
 *
 * Create the Owner before its Commands, Subscriptions, ManagedResources, or
 * Mounts. Pass `owner.name('LoadItems')` to their existing constructors, then
 * call `owner.define` after the Model and Message Schemas are available.
 */
export const owner = <const Namespace extends string>(
  namespace: Namespace extends ''
    ? never
    : Namespace extends `/${string}` | `${string}/` | `${string}//${string}`
      ? never
      : Namespace,
): Owner<Namespace> => {
  assertOwnerNamespace(namespace)

  const name: Owner<Namespace>['name'] = localName =>
    makeOwnedName(namespace, localName)

  const define: DefineOwnedSubmodel<Owner<Namespace>> = (config: any) =>
    makeDefinition(ownerValue, config)

  const ownerValue: Owner<Namespace> = { namespace, name, define }

  return ownerValue
}
