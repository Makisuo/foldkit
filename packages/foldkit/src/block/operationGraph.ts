let currentChildren: ReadonlyArray<object> | undefined

/** @internal Runs a synchronous Block operation with its direct child graph active. */
export const withOperationGraph = <Value>(
  children: ReadonlyArray<object>,
  operation: () => Value,
): Value => {
  const previousChildren = currentChildren
  currentChildren = children

  try {
    return operation()
  } finally {
    currentChildren = previousChildren
  }
}

/** @internal Rejects a bound operation outside its exact registered parent graph. */
export const assertRegisteredBinding = (
  binding: object,
  placement: string,
): void => {
  if (currentChildren !== undefined && !currentChildren.includes(binding)) {
    throw new Error(
      `[foldkit] The child binding at placement "${placement}" is not registered in the current Block graph.`,
    )
  }
}
