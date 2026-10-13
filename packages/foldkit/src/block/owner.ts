/** @internal Marks whether a named Block identity was created from a concrete literal. */
export const ConcreteOwnerTypeId = Symbol('foldkit/Block/ConcreteOwner')

/** @internal The stable identity shared by one named Block's definitions. */
export interface Owner<Id extends string, Concrete extends boolean = boolean> {
  readonly id: Id
  readonly namespace: Id
  readonly token: object
  readonly [ConcreteOwnerTypeId]: Concrete
}

/** @internal Creates the runtime identity behind `Block.define`. */
export const makeOwner = <const Id extends string>(
  id: Id,
): Owner<Id, true> => ({
  id,
  namespace: id,
  token: {},
  [ConcreteOwnerTypeId]: true,
})

/** @internal Recovers whether an Owner retains a concrete literal identity. */
export type IsConcreteOwner<OwnerValue> =
  OwnerValue extends Owner<string, infer Concrete> ? Concrete : false
