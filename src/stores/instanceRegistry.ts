import { defineStore, getActivePinia } from "pinia"

type InstanceStoreFactory<StoreType> = () => StoreType

interface ScopedInstanceParameters {
  instanceKey: string
  /** Optional isolation scope (the OpenAPI service id). */
  scope?: string
}

/** Builds the dictionary key; the service scope isolates specs. */
function storeKey(instanceKey: string, scope?: string): string {
  return scope ? `${scope}:${instanceKey}` : instanceKey
}

interface CreateInstanceRegistryOptions<
  Parameters extends ScopedInstanceParameters,
  StoreType,
> {
  /**
   * Prefix of the generated Pinia store id. The full id is
   * `<idPrefix>:<instanceKey>`, so one store exists per instance key and per
   * shape (`admin-list`, `admin-detail`, `admin-form`).
   */
  idPrefix: string
  /** Store setup: builds the slice from the instance parameters. */
  setup: (parameters: Parameters) => StoreType
}

/**
 * A keyed dictionary of instance stores scoped to the active Pinia (one map per
 * SSR request / per client app). Each shape (list, detail, form) keeps its own
 * registry, so using a standalone detail with a new key creates the detail
 * entry only — the list and form dictionaries stay untouched — while the global
 * config stays shared.
 */
function createInstanceRegistry<
  Parameters extends ScopedInstanceParameters,
  StoreType,
>(options: CreateInstanceRegistryOptions<Parameters, StoreType>) {
  const registries = new WeakMap<
    object,
    Map<string, InstanceStoreFactory<StoreType>>
  >()

  function registry():
    | Map<string, InstanceStoreFactory<StoreType>>
    | undefined {
    const pinia = getActivePinia()
    if (pinia === undefined) return undefined

    const existing = registries.get(pinia)
    if (existing !== undefined) return existing

    const created = new Map<string, InstanceStoreFactory<StoreType>>()
    registries.set(pinia, created)
    return created
  }

  /** Returns (creating on first use) the store for the given instance key. */
  function use(parameters: Parameters): StoreType {
    const storeRegistry = registry()
    const key = storeKey(parameters.instanceKey, parameters.scope)
    const existing = storeRegistry?.get(key)
    if (existing !== undefined) return existing()

    const useStore = defineStore(`${options.idPrefix}:${key}`, () =>
      options.setup(parameters),
    )
    storeRegistry?.set(
      key,
      useStore as unknown as InstanceStoreFactory<StoreType>,
    )
    return useStore() as StoreType
  }

  /** Returns an already-created store, or `undefined` when none exists. */
  function get(
    instanceKey: string | undefined,
    scope?: string,
  ): StoreType | undefined {
    if (instanceKey === undefined) return undefined
    return registry()?.get(storeKey(instanceKey, scope))?.()
  }

  return { get, use }
}

export { createInstanceRegistry }
export type { CreateInstanceRegistryOptions, ScopedInstanceParameters }
