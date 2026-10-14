import type { BindableBlock } from './binding.js'
import type { NamedIdentity } from './identity.js'
import type { InstanceKey } from './instanceContext.js'

/** @internal Enumerates a binding's active children from one parent Model. */
export type RuntimeBinding = Readonly<{
  block: BindableBlock
  inspection: Readonly<{
    subscriptions: object
    managedResources: object
    mounts: ReadonlyArray<unknown>
    EffectsLayer: unknown
  }>
  select: (
    model: any,
  ) => ReadonlyArray<Readonly<{ key?: InstanceKey; model: any }>>
  toParentMessage: (key: InstanceKey | undefined, message: any) => any
  subscriptionWhen: (
    model: any,
    key: InstanceKey | undefined,
    name: string,
  ) => boolean
}>

const bindings = new WeakMap<object, RuntimeBinding>()

/** @internal Associates a public binding with its Model enumeration and policies. */
export const registerBinding = (
  binding: object,
  runtime: RuntimeBinding,
): void => {
  bindings.set(binding, runtime)
}

/** @internal Reads the declared composition behavior of one child placement. */
export const runtimeBindingOf = (binding: object): RuntimeBinding => {
  const runtime = bindings.get(binding)
  if (runtime === undefined) {
    throw new Error(
      '[foldkit] Child bindings must be created by a completed Block.',
    )
  }
  return runtime
}

/** @internal Collects every named owner below a block's direct bindings. */
export const descendantOwnersOf = (
  children: ReadonlyArray<object>,
): ReadonlySet<NamedIdentity> => {
  const owners = new Set<NamedIdentity>()

  const visit = (binding: object): void => {
    const { block } = runtimeBindingOf(binding)
    owners.add(block.owner)

    for (const child of block.children) {
      visit(child)
    }
  }

  for (const child of children) {
    visit(child)
  }

  return owners
}
