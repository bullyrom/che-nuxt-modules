// eslint-disable-next-line import/no-unresolved
import { defineStore, getActivePinia } from "pinia"

type InstanceStoreFactory<StoreType> = () => StoreType

interface CreateInstanceRegistryOptions<
  Parameters extends { instanceKey: string },
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
  Parameters extends { instanceKey: string },
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
    const { instanceKey } = parameters
    const existing = storeRegistry?.get(instanceKey)
    if (existing !== undefined) return existing()

    const useStore = defineStore(`${options.idPrefix}:${instanceKey}`, () =>
      options.setup(parameters),
    )
    storeRegistry?.set(instanceKey, useStore)
    return useStore()
  }

  /** Returns an already-created store, or `undefined` when none exists. */
  function get(instanceKey: string | undefined): StoreType | undefined {
    if (instanceKey === undefined) return undefined
    return registry()?.get(instanceKey)?.()
  }

  return { get, use }
}

export { createInstanceRegistry }
export type { CreateInstanceRegistryOptions }
