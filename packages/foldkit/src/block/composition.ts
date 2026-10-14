import type { BindableBlock } from './binding.js'
import type { NamedIdentity } from './identity.js'
import type { InstanceKey } from './instanceContext.js'

type RuntimeParentContract = Readonly<{
  ownerToken: object
  Model: object
  Message: object
  OutMessage: object | undefined
}>

/** @internal Enumerates a Binding's active children from one parent Model. */
export type RuntimeBinding = Readonly<{
  block: BindableBlock
  parentContract?: RuntimeParentContract
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
      '[foldkit] Child Binding metadata is unavailable. Create Bindings through the parent Definition.bindChild method.',
    )
  }
  return runtime
}

/** @internal Associates a Binding with its exact parent Definition contract. */
export const registerBindingParentContract = (
  binding: object,
  parentContract: RuntimeParentContract,
): void => {
  const runtime = runtimeBindingOf(binding)
  bindings.set(binding, { ...runtime, parentContract })
}

/** @internal Rejects Bindings constructed under a different parent contract. */
export const assertBindingParentContracts = (
  parentContract: RuntimeParentContract,
  parentId: string,
  children: ReadonlyArray<object>,
): void => {
  for (const child of children) {
    const runtime = runtimeBindingOf(child)
    const bindingParent = runtime.parentContract

    if (
      bindingParent !== undefined &&
      (bindingParent.ownerToken !== parentContract.ownerToken ||
        bindingParent.Model !== parentContract.Model ||
        bindingParent.Message !== parentContract.Message ||
        bindingParent.OutMessage !== parentContract.OutMessage)
    ) {
      throw new Error(
        `[foldkit] Child Binding "${Reflect.get(child, 'placement')}" belongs to a different parent Definition contract. Create it through the exact "${parentId}" Definition.bindChild method.`,
      )
    }
  }
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
