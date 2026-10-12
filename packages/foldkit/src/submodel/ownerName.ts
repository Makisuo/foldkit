/**
 * @internal A primitive definition name scoped to one Submodel owner.
 */
export type OwnedName<
  Namespace extends string,
  LocalName extends string,
> = `${Namespace}/${LocalName}`

/**
 * @internal Validates a dynamically supplied Owner namespace.
 */
export const assertOwnerNamespace = (namespace: string): void => {
  if (
    namespace.length === 0 ||
    namespace.startsWith('/') ||
    namespace.endsWith('/') ||
    namespace.includes('//')
  ) {
    throw new Error(
      '[foldkit] A Submodel owner namespace must contain non-empty path segments.',
    )
  }
}

/**
 * @internal Joins a Submodel namespace and local definition name.
 */
export const makeOwnedName = <
  const Namespace extends string,
  const LocalName extends string,
>(
  namespace: Namespace,
  localName: LocalName extends ''
    ? never
    : LocalName extends `${string}/${string}`
      ? never
      : LocalName,
): OwnedName<Namespace, LocalName> => {
  assertOwnerNamespace(namespace)

  if (localName.length === 0 || localName.includes('/')) {
    throw new Error(
      '[foldkit] A Submodel owner local name must be non-empty and cannot contain "/".',
    )
  }

  return `${namespace}/${localName}`
}
